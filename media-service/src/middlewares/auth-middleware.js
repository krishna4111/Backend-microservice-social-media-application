const { logger } = require("../utils/logger");

const authenticateRequest = (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      logger.warn(`Access attempted without userId`);
      return res.status(401).json({
        success: false,
        message: "authentication required! , please login to continue",
      });
    }
    req.user = userId;
    next();
  } catch (error) {
    logger.error(`Error on authenticate user : ${error} `);
    throw error;
  }
};

module.exports = { authenticateRequest };
