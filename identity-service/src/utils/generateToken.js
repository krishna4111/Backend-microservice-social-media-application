require("dotenv").config();
const crypto = require("crypto");
const RefreshToken = require("../models/refreshToken");

const jwt = require("jsonwebtoken");

const generateToken = async (user) => {
  try {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "60m" }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); //refresh token expires in 7 days.

    await RefreshToken.create({
      token: refreshToken,
      expiresAt,
      userId: user._id,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error(`error when generating the token : ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = { generateToken };
