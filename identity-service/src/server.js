const express = require("express");
require("dotenv").config();
const { logger } = require("./utils/logger");
const identityServiceRoute = require("./routes/identityService");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { connectToDB } = require("./database/db");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const errorHandler = require("./middlewares/errorHandler");

//Db connection
(async () => {
  try {
    await connectToDB();
  } catch (error) {
    logger.error(
      `Error when connect with Db : ${error}  and the error message is : ${error.message}`
    );
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

//creating redis client
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received method is  ${req.method} and the url is ${req.url} `);
  logger.info(`Request body ${req.body}`);
  next();
});

//DDO Production and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient, //it is a redis client instance it stores the rate limit data , redis should be available to use this otherwise it wont works
  keyPrefix: "middleware", //this will add to all of our redis keys
  points: 10, //this is the maximum number of request that an user can send to a given second
  duration: 1, //in 1 sec user can send 10 request
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((error) => {
      logger.warn(`Rate Limit Exceeded For IP : ${req.ip}`);
      res.status(429).json({
        success: false,
        message: `Too many requests from you , try again later`,
      });
    });
});

//Ip based rate limiting for  sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //timelimit for each window
  max: 50, //it is the maximum number of request we gave.
  standardHeaders: true, //it tells weather we want to include the rate limit in the response header or not? , this allows the user to see how many request is left in the current time window
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP : ${req.ip}`);
    res.status(429).json({
      success: false,
      message: `Too many requests`,
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitiveEndpointsLimiter to our routes

app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", identityServiceRoute);

//error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Application is running on port :${PORT}`);
  logger.info(`Logger => Identity service  is running on port :${PORT}`);
});

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `unhandled Rejection at ${promise} , and the reason is :${reason}`
  );
});
