const redis = require("redis");
const redisearch = require("redis-redisearch");
const { promisify } = require("util");

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

const hgetall = promisify(client.hgetall).bind(client);
const ftSearch = promisify(client.ft_search).bind(client);
const ftSugget = promisify(client.ft_sugget).bind(client);
const ftSugadd = promisify(client.ft_sugadd).bind(client);

// GET hash by id
const asyncHgetall = async (hashId) => {
  const hash = await hgetall(hashId);
  return { id: hashId, ...hash };
};

// Transform a redis hash to key value pairs
const createRowData = ([key, value, ...rest], hash) => {
  if (!key) {
    return hash;
  }

  const newField = {};
  try {
    const objectValue = JSON.parse(value);
    newField[key] = objectValue;
  } catch (_) {
    newField[key] = value;
  }

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

// Run a Redisearch query
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

// Transform a redis suggestion output to object array
const createSuggestionData = (
  [suggestion, score, ...rest],
  data,
  defaultFields
) => {
  if (!suggestion) {
    return data;
  }

  const newData = [...data, { suggestion, score, ...defaultFields }];
  return createSuggestionData(rest, newData, defaultFields);
};

// Retrive a suggestion from a Redisearch suggestion dictonary
const asyncFtSugget = async (dictonary, searchText, max, fuzzy) => {
  const queryString = [dictonary, searchText];

  if (fuzzy) {
    queryString.push("FUZZY");
  }

  if (max) {
    queryString.push("MAX");
    queryString.push(max);
  }

  queryString.push("WITHSCORES");

  const suggestions = await ftSugget(queryString);
  const field = dictonary.split(":")[2];
  return suggestions
    ? createSuggestionData(suggestions, [], { dictonary, field })
    : [];
};

// Add an element to a Redisearch suggestion dictonary
const asyncFtSugadd = async (dictonary, term, increase) => {
  const queryString = [dictonary, term, 1];
  if (increase) {
    queryString.push("INCR");
  }

  return ftSugadd(queryString);
};

module.exports = {
  client,
  asyncFtSearch,
  asyncHgetall,
  asyncFtSugget,
  asyncFtSugadd,
};
