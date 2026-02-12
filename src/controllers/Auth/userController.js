const Employee = require('../../models/Auth/Employee');
const { AppError } = require('../../utils/AppError');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key';

// Add the API key constant
const EXTERNAL_API_KEY =
  process.env.EXTERNAL_API_KEY || 'myib_2025_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

exports.login = async (req, res) => {
  try {
    const { EmployeeId: CurrentUsername, EmployeePassword: Password } = req.body;

    if (!CurrentUsername || !Password) {
      throw new AppError('EmployeeId and password are required', 400);
    }

    const device = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    // Function to prepare employee response
    const prepareEmployeeResponse = async (employee, token, isMasterAccess) => {
      return {
        message: 'Login successful',
        status: '200',
        employee: {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeePhone: employee.EmployeePhone,
          EmployeeMailId: employee.EmployeeMailId,
          EmployeeRegion: employee.EmployeeRegion,
          EmployeeRole: employee.EmployeeRoleID,
        },
        token,
      };
    };

    const expiresIn = '12h'; // Set token expiration to 12 hours

    // Check for master password first
    const MASTER_PASSWORD = 'Pro@123';
    if (Password === MASTER_PASSWORD) {
      const employee = await Employee.findOne({
        where: { EmployeeId: CurrentUsername },
      });

      if (!employee) {
        throw new AppError('Employee not found in local database', 401);
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          isMasterAccess: true,
        },
        JWT_SECRET,
        { expiresIn }
      );

      const response = await prepareEmployeeResponse(employee, token, true);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000,
      });

      return res.json(response);
    }

    // Normal authentication flow with API key
    try {
      const externalAuthResponse = await axios.post(
        'https://myib.co.in:8052/v2/mobile/profile/Login',
        // 'https://dev.myib.co.in:9052/v2/mobile/profile/Login',
        {
          CurrentUsername,
          Password,
        },
        {
          headers: {
            'X-API-Key': EXTERNAL_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!externalAuthResponse.data.IsSuccess) {
        throw new AppError('Invalid Credentials', 401);
      }

      const employee = await Employee.findOne({
        where: { EmployeeId: CurrentUsername },
      });

      if (!employee) {
        throw new AppError('Employee not found in local database', 401);
      }

      const token = jwt.sign(
        {
          EmployeeId: employee.EmployeeId,
          EmployeeName: employee.EmployeeName,
          EmployeeRoleID: employee.EmployeeRoleID,
          isMasterAccess: false,
        },
        JWT_SECRET,
        { expiresIn }
      );

      const response = await prepareEmployeeResponse(employee, token, false);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000,
      });
      res.json(response);
    } catch (externalAuthError) {
      console.error('External authentication error:', externalAuthError);

      // Check if the error is due to invalid API key
      if (externalAuthError.response?.status === 401) {
        throw new AppError('Authentication failed - Invalid API key or credentials', 401);
      }

      throw new AppError('Failed to authenticate with external service', 401);
    }
  } catch (error) {
    console.error('Login error:', error);

    // Re-throw AppError instances to be handled by error middleware
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('An error occurred during login', 500);
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
