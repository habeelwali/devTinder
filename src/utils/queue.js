// queue.js
const BeeQueue = require('bee-queue');
const redis = require('./redisClient'); 

const emailQueue = new BeeQueue('emailQueue', {
  // Use the same Redis instance via createClient
  createClient: function (type) {
    return redis;
  },
});

console.log("✅ BeeQueue initialized with Redis instance");

module.exports = emailQueue;
