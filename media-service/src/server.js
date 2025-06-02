require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mediaRoutes = require('./routes/media-routes');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const connectToDB = require('./database/db');

const app = express();
connectToDB();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

app.use('/api/media', mediaRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Indentity service running on port ${PORT}`);
});

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandle rehjection at ', promise, "reason:", reason );
})