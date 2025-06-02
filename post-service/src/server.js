require("dotenv").config();
const express = require("express");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const connectToDB = require("./database/db");
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const {connectRabbitMQ} = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

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

// IP based rate limiting for sensitive endpoints
const sensitivePointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many request",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// routes -> pass redisClient to routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

// placing errorHandler below the routes and middleware make it to catch all the errors easily
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  } catch (err) {
      logger.error('Failed to connect to server',err);
      process.exit(1);
  }
}

startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
