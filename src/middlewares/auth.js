// const jwt = require('jsonwebtoken');
// const Employee = require('../models/Auth/Employee');

// // Middleware: Authenticate User
// const userAuth = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token;

//     if (!token) {
//       res.status(401).json({ message: 'Token not found' });
//       return;
//     }

//     const secretKey = process.env.JWT_SECRET_KEY;

//     if (!secretKey) {
//       throw new Error('JWT secret key not configured');
//     }

//     const decoded = jwt.verify(token, secretKey);

//     const user = await Employee.findByPk(decoded.EmployeeId);

//     if (!user) {
//       res.status(404).json({ message: 'Employee not found' });
//       return;
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: error.message || 'Authentication failed' });
//   }
// };

// module.exports = { userAuth };
