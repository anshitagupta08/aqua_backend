// src/middleware/errorHandler.ts
const { AppError } = require('../utils/AppError'); // make sure the path is correct

exports.errorHandler = (err, req, res, next) => {
  console.error(err); // You can replace this with a logger like winston in production

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.status;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
