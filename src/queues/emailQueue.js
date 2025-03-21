const BeeQueue = require('bee-queue');
const redis = require('../redisClient');

const emailQueue = new BeeQueue('emailQueue', {
  createClient: (type) => redis
});

module.exports = emailQueue;
