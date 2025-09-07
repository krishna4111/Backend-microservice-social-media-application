const { logger } = require("../utils/logger");

const errorHandler = (error, req, res, next) => {
  logger.error(error.stack);
  //if error status code is there then throws with that code otherwise use 500
  res.status(error.status || 500).json({
    message: error.message || "internal server error",
  });
};

module.exports = errorHandler;
