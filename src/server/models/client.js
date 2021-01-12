const redis = require("redis");
const redisearch = require("redis-redisearch");
const util = require("util");

const logger = require("../../logger");
const { redisDbUrl } = require("../../config");

// Establish connection and add Redisearch commands
redisearch(redis);
redis.addCommand("ft.sugadd");
const client = redis.createClient(redisDbUrl);

client.on("error", (err) => {
  logger.error(err, "RedisClient ERROR:");
});

client.on("connect", () => {
  logger.info("RedisClient: Connection established");
});

const hgetall = util.promisify(client.hgetall).bind(client);
const ftSearch = util.promisify(client.ft_search).bind(client);
const ftSugget = util.promisify(client.ft_sugget).bind(client);
const ftSugadd = util.promisify(client.ft_sugadd).bind(client);

module.exports = {
  client,
  hgetall,
  ftSearch,
  ftSugget,
  ftSugadd,
};
