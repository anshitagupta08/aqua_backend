class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;

    // Capture the correct stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
