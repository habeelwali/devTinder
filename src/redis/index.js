// redis/index.js
const { createClient } = require("redis");

const redisClients = {};

function createRedisClient(redisDb = 0) {
    if (redisClients[redisDb]) {
        return redisClients[redisDb];
    }

    console.info(`Connecting to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} (DB ${redisDb})`);

    const client = createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            connectTimeout: 30000,
            reconnectStrategy: (retries) => {
                console.info(`Redis reconnect attempt ${retries}`);
                return retries > 5 ? null : 10000;
            }
        },
        password: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
    });

    client.on("error", (err) => {
        console.error("❌ Redis Client Error:", err);
    });

    client.on("end", () => {
        console.info("Redis connection closed");
        delete redisClients[redisDb];
    });

    client.connect()
        .then(() => client.select(redisDb))
        .then(() => console.info(`✅ Connected to Redis DB ${redisDb} successfully`))
        .catch((err) => {
            console.error("❌ Error connecting/selecting Redis DB:", err);
        });

    redisClients[redisDb] = client;
    return client;
}

module.exports = createRedisClient;
