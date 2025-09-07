const User = require("../models/User");
const { logger } = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const { generateToken } = require("../utils/generateToken");
const RefreshToken = require("../models/refreshToken");
const crypto = require("crypto");
//user registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hits");
  try {
    //validate the schema
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn(
        `validation Error on registration : ${error.details[0].message}`
      );

      return res.status(400).json({
        success: false,
        message: `validation error on registration :${error.details[0].message}`,
      });
    }

    const { userName, email, password, firstName, lastName, profile } =
      req.body;

    let user = await User.findOne({
      $or: [{ email: email }, { userName: userName }],
    });

    if (user) {
      logger.warn(`User is already present`);
      return res
        .status(400)
        .json({ success: false, message: "User already present" });
    }

    user = new User({
      userName,
      email,
      password,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(profile && { profile }),
    });

    await user.save();
    logger.info("user created successfully");

    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      success: true,
      message: `User created successfully`,
      data: user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error(`Error when registering as a user : ${error}`);

    res.status(500).json({
      success: false,
      message: `Error when registering as a user : ${error}`,
    });
  }
};

//user login
const loginUser = async (req, res) => {
  logger.info("login endpoint hits");
  const { email, password } = req.body;
  const { error } = validateLogin(req.body);
  if (error) {
    logger.warn(`validation Error on login : ${error.details[0].message}`);

    return res.status(400).json({
      success: false,
      message: `validation error on login :${error.details[0].message}`,
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`user not found with the email :${email}`);
      return res.status(404).json({
        success: false,
        message: `user not found with the email :${email}`,
      });
    }
    //validate password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn(`Invalid Password`);
      return res.status(400).json({
        success: false,
        message: `Invalid Password`,
      });
    }
    const { accessToken, refreshToken } = await generateToken(user);

    logger.info("user login successfully");
    return res.status(200).json({
      success: false,
      message: `User login successfully`,
      refreshToken,
      accessToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error(`Error when login ${error}`);
    res
      .status(500)
      .json({ success: false, message: `Error when login ${error}` });
  }
};

//refresh token
const generateRefreshToken = async (req, res) => {
  logger.info("Refresh token endpoint hits...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn(`Refresh Token is missing`);
      return res.status(404).json({
        success: false,
        message: `refresh token is missing`,
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn(`Invalid Or Expired Refresh Token`);
      return res.status(401).json({
        success: false,
        message: `Invalid Or Expired Refresh Token`,
      });
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
      logger.warn(`Refresh Tokens user not found`);
      return res.status(404).json({
        success: false,
        message: `Refresh Tokens user not found`,
      });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshToken.deleteOne({ _id: storedToken._id });

    logger.info("Token generated successfully");

    return res.status(201).json({
      success: true,
      message: "Token generated successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error(`Error when generating the refresh token ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when generating the refresh token ${error}`,
    });
  }
};

//logout
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hits");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn(`Refresh Token is missing`);
      return res.status(404).json({
        success: false,
        message: `refresh token is missing`,
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh Token deleted for logout");
    return res.status(200).json({
      success: true,
      message: "Refresh Token deleted for logout",
    });
  } catch (error) {
    logger.error(`Error when logout a users ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when logout a users ${error}`,
    });
  }
};

module.exports = { registerUser, loginUser, generateRefreshToken, logoutUser };
