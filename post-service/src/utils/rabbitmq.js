const amqp = require("amqplib");
const { logger } = require("../utils/logger");
require("dotenv").config();

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectRabbitMq() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL); //this will create connection to rabbitmq.
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("connected to rabbit mq ");
    return channel;
  } catch (error) {
    logger.error(`Error connecting to rabbit mq : ${error}`);
  }
}

//the routing key is the unique identifier , by using this only we will found what operation we are going to do.
async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectRabbitMq();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );

  logger.info(`Event Published : ${routingKey}`);
}

module.exports = { connectRabbitMq, publishEvent };
