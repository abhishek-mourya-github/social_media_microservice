require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const helmet =  require('helmet');
const cors = require('cors');
const {rateLimiterRedis, RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const routes = require('./routes/identity-route');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// connect to database
const connectToDB  = require('./database/db');
connectToDB();

const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});


// DDoS protection and rate limiting
// rate-limiter-flexible used to track how many request each IP makes
// too many request will get blocked
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient, // count will store in storeClient
    keyPrefix : 'middleware',  // keyPrefix only label the data like middlware:127.32.12.42
    points : 10,  // 10 request 
    duration : 1  // in 1 second
})


// it will stop the user for sending more request
app.use((req, res, next) => {
      rateLimiter.consume(req.ip) // .comsume() check either the limit exceeds or not
      .then(() => next()) // if not next() call
      .catch(() => { // if not then warn us
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success : false,
            message : "Too many request"
        })
      })
});


// IP based rate limiting for sensitive endpoints
const sensitivePointLimiter = rateLimit({
    windowMs : 15*60*1000, // 15 minutes
    max : 50,
    standardHeaders : true, 
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success : false,
            message : "Too many request"
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    }),
});

// apply this sensitivePointLimiter to our routes
app.use('/api/auth/register', sensitivePointLimiter);

// Routes 
app.use('/api/auth', routes);

// errorHandler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Indentity service running on port ${PORT}`);
});

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandle rehjection at ', promise, "reason:", reason );
})