const createRedisClient = require("./index");

async function getRedisData(key, redisDb = 0) {
    const client = createRedisClient(redisDb);
    try {
        const data = await client.get(key);
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error while fetching ${key}:`, error);
        return null;
    }
}

async function getAllData(keys, redisDb = 0) {
    const client = createRedisClient(redisDb);
    try {
        if (!Array.isArray(keys) || keys.length === 0) return [];
        const data = await client.mGet(keys);
        return data?.filter(Boolean) || [];
    } catch (error) {
        console.error(`Error while fetching keys:`, error);
        return [];
    }
}

async function setRedisData({ key, tls, data }, redisDb = 0) {
    const client = createRedisClient(redisDb);
    try {
        const value = JSON.stringify(data);
        await client.setEx(key, tls, value);
    } catch (error) {
        console.error(`Error while setting ${key}:`, error);
    }
}

async function setData({ key, data }, redisDb = 0) {
    const client = createRedisClient(redisDb);
    try {
        const value = JSON.stringify(data);
        await client.set(key, value);
    } catch (error) {
        console.error(`Error while setting ${key}:`, error);
    }
}

async function flushDatabase(redisDb = 0) {
    const client = createRedisClient(redisDb);
    try {
        await client.flushDb();
        console.info(`Flushed Redis DB ${redisDb}`);
    } catch (err) {
        console.error("Error flushing Redis DB:", err);
    }
}

module.exports = {
    getRedisData,
    getAllData,
    setRedisData,
    setData,
    flushDatabase
};
