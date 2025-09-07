require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { logger } = require("./utils/logger");
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/errorHandler");
const { validateToken } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => {
  logger.info("Redis TCP connection established.");
});
redisClient.on("ready", () => {
  logger.info("Redis is ready to receive commands.");
});

redisClient.on("error", (err) => {
  logger.warn("Redis error:", err);
});

app.use(helmet());
app.use(cors());
app.use(express.json());

//DDO Production and rate limiting
//Ip based rate limiting for  sensitive endpoints
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //timelimit for each window
  max: 100, //it is the maximum number of request we gave.
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

app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info(`Received method is  ${req.method} and the url is ${req.url} `);
  logger.info(`Request body ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: function (req) {
    logger.info(`Original Url : ${req.originalUrl}`);
    const replacedUrl = req.originalUrl.replace(/^\/v1/, "/api");
    logger.info(`Replaced Url : ${replacedUrl}`);
    return replacedUrl;
  },
  proxyErrorHandler: (error, res, next) => {
    logger.error(`Proxy Error : ${error.message} and the error is ${error}`);
    res.status(500).json({
      success: false,
      message: `Internal server error , error : ${error.message}`,
      details: error?.errors || error?.message || error,
    });
  },
};

//setting up proxy for our identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      //by using this we just defines the header type
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    //userResDecorator -> this will works after the response is received from the proxied server
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from identity service : ${proxyRes.statusCode} `
      );
      return proxyResData;
    },
  })
);

//setting up proxy for the post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      //by using this we just defines the header type
      proxyReqOpts.headers["Content-Type"] = "application/json";
      //srcRed is the req i here
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId; //in here not from req , it is srcReq we get from the function params
      return proxyReqOpts;
    },
    //userResDecorator -> this will works after the response is received from the proxied server
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from post service : ${proxyRes.statusCode} `
      );
      return proxyResData;
    },
  })
);

//setting up proxy for the Media service
app.use(
  "/v1/medias",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      //by using this we just defines the header type
      //srcRed is the req i here
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId; //in here not from req , it is srcReq we get from the function params

      if (
        srcReq.headers["Content-type"] &&
        !srcReq.headers["Content-type"].startsWith("multipart/form-data")
      ) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      }

      return proxyReqOpts;
    },
    //userResDecorator -> this will works after the response is received from the proxied server
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from media service : ${proxyRes.statusCode} `
      );
      return proxyResData;
    },
    parseReqBody: false,
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port : ${PORT}`);
  logger.info(
    `Identity service is running on port ${process.env.IDENTITY_SERVICE_URL} `
  );
  logger.info(
    `Post service is running on port ${process.env.POST_SERVICE_URL} `
  );
  logger.info(
    `Media service is running on port ${process.env.MEDIA_SERVICE_URL} `
  );
  logger.info(`Redis Url is : ${process.env.REDIS_URL} `);
});
