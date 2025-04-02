// queues/emailQueue.js
const BeeQueue = require("bee-queue");
const redis = require("../redis/beeRedisClient"); // <-- uses ioredis-compatible client

const emailQueue = new BeeQueue("emailQueue", {
  createClient: (type) => redis // BeeQueue will reuse this client
});

module.exports = emailQueue;
