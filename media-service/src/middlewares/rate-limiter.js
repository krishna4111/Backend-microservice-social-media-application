const { logger } = require("../utils/logger");

//TODO: the key is not expiring check why it is not expired
const rateLimiter = ({ windowSize, limit, rateLimiterFeature }) => {
  return async (req, res, next) => {
    const redis = req.redis;
    try {
      const key = `${rateLimiterFeature}-ip-${req.ip}`;
      let totalAttempt = await redis.get(key);

      if (!totalAttempt) {
        await redis.setex(key, windowSize, 1);
        totalAttempt = 1;
      } else {
        await redis.incr(key);
      }

      if (totalAttempt > limit) {
        return res.status(429).json({
          success: false,
          message: "Too many Requests , try again after some time",
        });
      }
      next();
    } catch (error) {
      logger.warn(`Error on rate limiting middleware : ${error}`);
      next();
    }
  };
};
module.exports = { rateLimiter };
