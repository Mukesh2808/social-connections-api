// middleware/errorHandler.js

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Database error handler
const handleDatabaseError = (err) => {
    console.error('Database Error:', err);

    // PostgreSQL error codes
    switch (err.code) {
        case '23505': // Unique constraint violation
            if (err.constraint?.includes('users_user_str_id_key')) {
                return new AppError('User with this ID already exists', 409, 'USER_EXISTS');
            }
            if (err.constraint?.includes('connections_user1_str_id_user2_str_id_key')) {
                return new AppError('Connection already exists between these users', 409, 'CONNECTION_EXISTS');
            }
            return new AppError('Duplicate entry detected', 409, 'DUPLICATE_ENTRY');

        case '23503': // Foreign key constraint violation
            return new AppError('Referenced user does not exist', 404, 'USER_NOT_FOUND');

        case '23514': // Check constraint violation
            if (err.constraint?.includes('connections_check')) {
                return new AppError('Invalid connection: user IDs must be different and ordered', 400, 'INVALID_CONNECTION');
            }
            return new AppError('Data validation constraint violated', 400, 'CONSTRAINT_VIOLATION');

        case '42P01': // Undefined table
            return new AppError('Database table not found. Please run database setup.', 500, 'TABLE_NOT_FOUND');

        case 'ECONNREFUSED':
            return new AppError('Database connection refused. Please check if PostgreSQL is running.', 500, 'DATABASE_UNAVAILABLE');

        case 'ENOTFOUND':
            return new AppError('Database host not found. Please check your database configuration.', 500, 'DATABASE_HOST_NOT_FOUND');

        default:
            return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
    }
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Details:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
            statusCode: err.statusCode
        });
    }

    // Handle specific error types
    if (err.code) {
        error = handleDatabaseError(err);
    }

    // Handle JWT errors (if you add authentication later)
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join('. ');
        error = new AppError(message, 400, 'VALIDATION_ERROR');
    }

    // Handle rate limit errors
    if (err.status === 429) {
        error = new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Default to 500 server error
    if (!error.statusCode) {
        error = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
    }

    // Prepare error response
    const errorResponse = {
        status: error.status || 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Add error code if available
    if (error.code) {
        errorResponse.code = error.code;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    // Send error response
    res.status(error.statusCode || 500).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler
};
