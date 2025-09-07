const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
const mediaRoutes = require("./routes/media-routes");
const { logger } = require("./utils/logger");
const { createRedisClient } = require("./utils/redis");
const { connectToDB } = require("./database/db");
const errorHandler = require("./middlewares/errorHandler");
const { connectRabbitMq, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");

const PORT = process.env.PORT || 3003;
const app = express();

async function startServer() {
  try {
    //connect to Db
    await connectToDB();
    //make redis connection
    const redisClient = await createRedisClient();

    //rabbitMq connection
    await connectRabbitMq();

    //consume all the events from rabbitMQ
    await consumeEvent("post.deleted", handlePostDeleted);

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

    app.use("/api/medias", mediaRoutes);

    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Media service is running on port :${PORT}`);
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
