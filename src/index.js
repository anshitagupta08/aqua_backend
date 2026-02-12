// Only load dotenv if not in test environment
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./configs/sequelize');
const { errorHandler } = require('./middlewares/errorHandler');

// Initialize all models to register associations
require('./models/index');

// Create an Express application
const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'https://crm-abispro.abisibg.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3011',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');

// CORS configuration
const corsOptions = {
  origin: [
    'https://crm-abispro.abisibg.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3011',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  // credentials: true,
};
app.use(cors(corsOptions));

// Socket.IO connection management
const connectedClients = new Map(); // Map of socketId -> client info
const agentConnections = new Map(); // Map of agentNumber -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`🔌 Socket client connected: ${socket.id}`);

  // Handle agent registration
  socket.on('register-agent', (data) => {
    const { agentNumber, employeeId, employeeName } = data;

    console.log(`👤 Agent registered: ${agentNumber} (${employeeName})`);

    // Store client info
    connectedClients.set(socket.id, {
      socketId: socket.id,
      agentNumber,
      employeeId,
      employeeName,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    // Track by agent number
    if (!agentConnections.has(agentNumber)) {
      agentConnections.set(agentNumber, new Set());
    }
    agentConnections.get(agentNumber).add(socket.id);

    // Join agent-specific room
    socket.join(`agent_${agentNumber}`);

    // Send confirmation
    socket.emit('registration-confirmed', {
      success: true,
      agentNumber,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Broadcast agent status
    io.emit('agent-status', {
      agentNumber,
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.lastActivity = new Date();
      socket.emit('pong', { timestamp: new Date().toISOString() });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Socket client disconnected: ${socket.id}`);

    const client = connectedClients.get(socket.id);
    if (client) {
      const { agentNumber } = client;

      // Remove from agent connections
      if (agentConnections.has(agentNumber)) {
        agentConnections.get(agentNumber).delete(socket.id);
        if (agentConnections.get(agentNumber).size === 0) {
          agentConnections.delete(agentNumber);

          // Broadcast agent offline status
          io.emit('agent-status', {
            agentNumber,
            status: 'offline',
            timestamp: new Date().toISOString(),
          });
        }
      }

      connectedClients.delete(socket.id);
    }
  });
});

// Socket.IO helper functions
const socketManager = {
  // Send to specific agent
  sendToAgent: (agentNumber, eventType, data) => {
    const socketIds = agentConnections.get(agentNumber);
    if (!socketIds || socketIds.size === 0) {
      console.log(`📡 No socket clients found for agent ${agentNumber}`);
      return false;
    }

    const message = {
      eventType,
      timestamp: new Date().toISOString(),
      ...data,
    };

    socketIds.forEach((socketId) => {
      io.to(socketId).emit(eventType, message);
    });

    console.log(`📡 Sent ${eventType} to agent ${agentNumber} (${socketIds.size} clients)`);
    return true;
  },

  // Broadcast to all clients
  broadcast: (eventType, data) => {
    const message = {
      eventType,
      timestamp: new Date().toISOString(),
      ...data,
    };

    io.emit(eventType, message);
    console.log(`📡 Broadcasted ${eventType} to all clients (${connectedClients.size} total)`);
  },

  // Get connection stats
  getStats: () => {
    return {
      totalClients: connectedClients.size,
      agentConnections: Array.from(agentConnections.entries()).map(([agent, sockets]) => ({
        agentNumber: agent,
        socketCount: sockets.size,
        clients: Array.from(sockets).map((socketId) => {
          const client = connectedClients.get(socketId);
          return {
            socketId,
            employeeName: client?.employeeName,
            connectedAt: client?.connectedAt,
          };
        }),
      })),
      connectedClients: Array.from(connectedClients.values()),
    };
  },
};

// Make socketManager available globally
app.set('socketManager', socketManager);
app.set('io', io);

// IMPORTANT: Add socketManager middleware BEFORE routes
app.use('/api', (req, res, next) => {
  req.socketManager = socketManager;
  next();
});

//attach socket in every request
app.use((req, res, next) => {
  req.io = app.get("io");
  next();
});

// Import and use calling routes
const { router } = require('./controllers/Calling/callingController');
app.use('/api', router);

// Import other routes
const userRoutes = require('./routes/Auth/userRoutes');
const customerRoutes = require('./routes/Customer/customerRoutes');
const orderRoutes = require('./routes/Customer/orderRoutes');
const orderItemRoutes = require('./routes/Customer/orderItemRoutes');
const productRoutes = require('./routes/Customer/productRoutes');
const customerFeedbackRoutes = require('./routes/Customer/customerFeedbackRoutes');
const customersInfoRoutes = require('./routes/Customer/customerInfoRoutes');
const dashboardRoutes = require('./routes/Dashboard/dashboardRoutes');
const formRoutes = require('./routes/Form/formRoutes');
const supportTypeRoutes = require('./routes/Form/supportTypeRoutes');
const queryTypeRoutes = require('./routes/Form/queryTypeRoutes');
const outboundCallTypesRoutes = require('./routes/Form/outboundCallTypesRoutes');
const callStatusRoutes = require('./routes/Form/callStatusRoutes');
const outcomeTagRoutes = require('./routes/Form/outcomeTagRoutes');
const closureStatusRoutes = require('./routes/Form/closureStatusRoutes');
const callDispositionRoutes = require('./routes/Form/callDispositionRoutes');
const incomingCallRoutes = require('./routes/Report/incomingCallRoutes');
const outcomingCallRoutes = require('./routes/Report/outcomingCallRoutes');
const contactDirectoryRoutes = require('./routes/Contact/contactDirectoryRoutes');
const sourceTypeRoutes = require('./routes/Form/sourceTypeRoutes');
const callHistoryRoutes = require('./routes/Call History/callHistoryRoutes');
const followupCallRoutes = require('./routes/Report/followupCallRoutes');

// Use routes
app.use('/api/', userRoutes);
app.use('/api/', customerRoutes);
app.use('/api/', orderRoutes);
app.use('/api/', orderItemRoutes);
app.use('/api/', productRoutes);
app.use('/api/', customerFeedbackRoutes);
app.use('/api/', customersInfoRoutes);
app.use('/api/', dashboardRoutes);
app.use('/api/', formRoutes);
app.use('/api/', supportTypeRoutes);
app.use('/api/', queryTypeRoutes);
app.use('/api/', outboundCallTypesRoutes);
app.use('/api/', callStatusRoutes);
app.use('/api/', outcomeTagRoutes);
app.use('/api/', closureStatusRoutes);
app.use('/api/', callDispositionRoutes);
app.use('/api/', incomingCallRoutes);
app.use('/api/', outcomingCallRoutes);
app.use('/api/', contactDirectoryRoutes);
app.use('/api/', sourceTypeRoutes);
app.use('/api/', callHistoryRoutes);
app.use('/api/', followupCallRoutes);

// Socket stats endpoint
app.get('/api/socket-stats', (req, res) => {
  res.json(req.socketManager.getStats());
});

// Health check route
app.get('/ping', (_req, res) => {
  res.send('pong');
});

// Root route
app.get('/', (_req, res) => {
  res.send('"ABIS-PRO CRM" Backend with Socket.IO is running');
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
const devMode = process.env.NODE_ENV === 'development';

// Start the server and connect to the database
server.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();

    setInterval(async () => {
      try {
        await sequelize.authenticate();
        console.log('DB connection is alive');
      } catch (err) {
        console.error('DB connection lost:', err);
      }
    }, 20000);

    console.log('DB connected');
  } catch (error) {
    console.error('DB connection failed:', error);
  }

  if (devMode) {
    console.log(`🚀 Server with Socket.IO running in development mode on http://localhost:${PORT}`);
  } else {
    console.log(`🚀 Server with Socket.IO running in production mode on http://0.0.0.0:${PORT}`);
  }
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
