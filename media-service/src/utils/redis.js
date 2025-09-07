require("dotenv").config();
const Redis = require("ioredis");
const { logger } = require("../utils/logger");

const createRedisClient = async () => {
  const redis = new Redis(process.env.REDIS_URL);

  redis.on("connect", () => {
    logger.info("Redis connection made successfully");
  });

  redis.on("ready", () => {
    logger.info("Redis is ready for operations");
  });

  redis.on("error", () => {
    logger.warn(`Error occured when connect with redis: ${error}`);
  });
  return redis;
};

module.exports = { createRedisClient };
