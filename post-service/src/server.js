require("dotenv").config();
const express = require("express");
const { connectToDB } = require("./database/db");
const { createRedisClient } = require("./utils/redis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-rotes");
const errorHandler = require("./middlewares/errorHandler");
const { logger } = require("./utils/logger");
const { connectRabbitMq } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    //connect to Db
    await connectToDB();
    //make redis connection
    const redisClient = await createRedisClient();

    //makes the rabbitmq connection
    await connectRabbitMq();

    app.use(express.json());
    app.use(helmet());
    app.use(cors());

    //logging the incoming req
    app.use((req, res, next) => {
      logger.info(
        `Received method is  ${req.method} and the url is ${req.url} `
      );
      logger.info(`Request body ${req.body}`);
      next();
    });

    app.use((req, res, next) => {
      req.redis = redisClient;
      next();
    });

    app.use("/api/posts", postRoutes);

    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Post service is running on port :${PORT}`);
    });
  } catch (error) {
    //TODO: Redis connection do not stops our app to run bcz , every api dose not depends on redis
    logger.error(`Error when starting the server : ${error}`);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`unhandled rejection at ${promise} , reason: ${reason}`);
});
