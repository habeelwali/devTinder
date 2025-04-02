const IORedis = require("ioredis");

console.log("🔍 Redis ENV values:", {
  redisUrl: process.env.REDIS_URL
});

const beeRedisClient = new IORedis(process.env.REDIS_URL, {
  connectTimeout: 30000,
  retryStrategy: (times) => {
    console.log(`BeeQueue Redis reconnect attempt ${times}`);
    return times > 5 ? null : 10000;
  }
});

beeRedisClient.on("connect", () => {
  console.log("✅ BeeQueue connected to Redis Cloud");
});

beeRedisClient.on("error", (err) => {
  console.error("❌ BeeQueue Redis error:", err);
});

module.exports = beeRedisClient;
