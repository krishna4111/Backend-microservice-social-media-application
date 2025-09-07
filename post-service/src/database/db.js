const mongoose = require("mongoose");
require("dotenv").config();
const { logger } = require("../utils/logger");

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    logger.info(`Mongo Db connection made successfully`);
  } catch (error) {
    logger.error(`Error when connect with Db : ${error}`, {
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = { connectToDB };
