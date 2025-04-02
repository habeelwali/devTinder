const redis = require("redis");
const { URL } = require("url");

// Parse Redis URL
const redisUrl = new URL(process.env.REDIS_URL);

// Create compatible client - FIXED METHOD NAME
const beeRedisClient = redis.createClient({
  host: redisUrl.hostname,
  port: redisUrl.port,
  password: redisUrl.password,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
  retry_strategy: (options) => {
    console.log(`Redis reconnect attempt ${options.attempt}`);
    return options.attempt > 5 ? undefined : 10000;
  }
});

// Connection events
beeRedisClient.on("connect", () => {
  console.log("✅ Redis Cloud connected:", redisUrl.hostname);
});

beeRedisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

module.exports = beeRedisClient;