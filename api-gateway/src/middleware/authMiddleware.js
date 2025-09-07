const { logger } = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("Authorization toke is required");
    return res.status(401).json({
      success: false,
      message: `Authorization token is required`,
    });
  }

  try {
    const user = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Invalid or expired authorization token : ${error}`);

    return res.status(500).json({
      success: false,
      message: "Invalid or expired authorization token",
      error,
    });
  }
};

module.exports = { validateToken };
