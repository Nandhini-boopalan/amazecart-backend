const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === "development") {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    if (process.env.NODE_ENV === "production") {
        let error = { ...err };

        if (err.name === "ValidationError") {
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400);
            err.statusCode=400
        }

        if (err.name === 'CastError') {
            const message = `Resource not found ${err.path}`;
            error = new ErrorHandler(message, 400);
            err.statusCode=400
        }

        if(err.code ===11000){
            let message=`Duplicate ${object.keys(err.keyValue)} error`
            error = new ErrorHandler(message, 400);
            err.statusCode=400
        }

        if(err.code ==='JSONWebTokenError'){
            let message='JSON Web Token is invalid.Try again'
            error = new ErrorHandler(message, 400);
            err.statusCode=400
        }

        if(err.code ==='TokenExpiredError'){
            let message='JSON Web Token is expired.Try again'
            error = new ErrorHandler(message, 400);
        }

        // Sending error response
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};


