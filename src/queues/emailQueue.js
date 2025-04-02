// queues/emailQueue.js
const BeeQueue = require("bee-queue");
const redisClient = require("../redis/beeRedisClient");

const emailQueue = new BeeQueue("emailQueue", {
  redis: redisClient,
  isWorker: true,
  removeOnSuccess: true
});

module.exports = emailQueue;
