const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    
    if (err.message.includes('header content')) {
        return res.status(400).json({
            message: 'Invalid header content',
            details: err.message
        });
    }
    
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
    });
}

module.exports = errorHandler;