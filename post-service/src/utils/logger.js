const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  //this is the message format
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), //include the stack trace in the log entry if there is any error
    winston.format.splat(), //enable support for message templating
    winston.format.json()
  ),
  defaultMeta: { service: "post-service" },
  //transport specifies the destination where we have to store the logs
  transports: [
    new winston.transports.Console({
      //what ever we are having the log , we need it in the console
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    //we will create two files one is for logs the error , another one is for combined logs
    //this handles only the error we have to mention the error.
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    //it handles combine log , so we didnt mention any level
    new winston.transports.File({
      filename: "combine.log",
    }),
  ],
});

module.exports = {
  logger,
};
