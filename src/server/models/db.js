const redis = require("redis");
const redisearch = require("redis-redisearch");
const { promisify } = require("util");

const { redisDbUrl } = require("../../config");

redisearch(redis);
const client = redis.createClient(redisDbUrl);

const hgetall = promisify(client.hgetall).bind(client);
const ftSearch = promisify(client.ft_search).bind(client);

// Transform a redis hash to key value pairs
const createRowData = ([key, value, ...rest], hash) => {
  if (!key) {
    return hash;
  }

  const newField = {};
  newField[key] = value;
  return createRowData(rest, { ...hash, ...newField });
};

// Format the hash array returned from a redis search operation
const formatQueryResult = ([id, score, row, ...rest], rows) => {
  if (!id) {
    return rows;
  }
  const hash = createRowData(row, { id, score });
  return formatQueryResult(rest, [...rows, hash]);
};

const asyncFtSearch = async (
  indexName,
  { offset, limit, sort, queryString }
) => {
  const searchParams = [indexName, queryString, "WITHSCORES"];

  if (offset || limit) {
    searchParams.push("LIMIT");
    searchParams.push(offset || 0);
    searchParams.push(limit || 10);
  }

  if (sort) {
    searchParams.push("SORTBY");
    searchParams.push(sort.field);
    searchParams.push(sort.direction || "ASC");
  }

  const searchResult = await ftSearch(searchParams);
  const [totalResults, ...rows] = searchResult;
  const formatedRows = formatQueryResult(rows, []);

  return { totalResults, rows: formatedRows };
};

const asyncHgetall = async (hashId) => {
  const hash = await hgetall(hashId);
  return { id: hashId, ...hash };
};

module.exports = {
  client,
  asyncFtSearch,
  asyncHgetall,
};
