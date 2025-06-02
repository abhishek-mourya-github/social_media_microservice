const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("MongoDB connection successfully");
    } catch (error) {
        logger.error('MongoDB connection failed', error);
        process.exit(1);
    }
}

module.exports = connectToDB;