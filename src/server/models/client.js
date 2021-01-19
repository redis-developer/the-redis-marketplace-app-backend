const redis = require("redis");
const redisearch = require("redis-redisearch");
const { promisify } = require("util");

const logger = require("../../logger");
const { dbConfig } = require("../../config");

const { redisDbUrl } = dbConfig;

// Establish connection and add Redisearch commands
redisearch(redis);
redis.addCommand("ft.sugadd");
redis.addCommand("ft.dropindex");
redis.addCommand("ft._list");
const client = redis.createClient(redisDbUrl);

client.on("error", (err) => {
  logger.error(err, "RedisClient ERROR:");
});

client.on("connect", () => {
  logger.info("RedisClient: Connection established");
});

const hgetall = promisify(client.hgetall).bind(client);
const ftSearch = promisify(client.ft_search).bind(client);
const ftSugget = promisify(client.ft_sugget).bind(client);
const ftSugadd = promisify(client.ft_sugadd).bind(client);
const hSet = promisify(client.hset).bind(client);
const hMget = promisify(client.hmget).bind(client);
const redisScan = promisify(client.scan).bind(client);
const ftSugDel = promisify(client.ft_sugdel).bind(client);
const rPush = promisify(client.rpush).bind(client);
const lRange = promisify(client.lrange).bind(client);
const lRem = promisify(client.lrem).bind(client);
const removeRedisKey = promisify(client.del).bind(client);

module.exports = {
  client,
  hgetall,
  ftSearch,
  ftSugget,
  ftSugadd,
  hSet,
  hMget,
  redisScan,
  ftSugDel,
  rPush,
  lRange,
  lRem,
  removeRedisKey,
};
