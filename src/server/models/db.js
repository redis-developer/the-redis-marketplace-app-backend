const client = require("./client.js");

// GET hash by id
const asyncHgetall = async (hashId) => {
  const hash = await client.hgetall(hashId);
  return hash ? { id: hashId, ...hash } : {};
};

// Transform a redis hash to key value pairs
const createRowData = ([key, value, ...rest], hash, arrayFields) => {
  if (!key) {
    return hash;
  }

  const newField = {};
  try {
    const objectValue = JSON.parse(value);
    newField[key] = objectValue;
  } catch (_) {
    if (arrayFields.indexOf(key) > -1) {
      newField[key] = value.split(", ");
    } else {
      newField[key] = value;
    }
  }

  return createRowData(rest, { ...hash, ...newField }, arrayFields);
};

// Format the hash array returned from a redis search operation
const formatQueryResult = ([id, score, row, ...rest], rows, arrayFields) => {
  if (!id) {
    return rows;
  }

  const hash = createRowData(row, { id, score }, arrayFields);
  return formatQueryResult(rest, [...rows, hash], arrayFields);
};

// Run a Redisearch query
const asyncFtSearch = async (
  indexName,
  { offset, limit, highlight, sort, queryString }
) => {
  const searchParams = [indexName, queryString, "WITHSCORES"];

  const offsetValue = typeof offset === "undefined" ? 0 : offset;
  const limitValue = typeof limit === "undefined" ? 10 : limit;

  searchParams.push("LIMIT");
  searchParams.push(offsetValue);
  searchParams.push(limitValue);

  if (highlight) {
    searchParams.push("HIGHLIGHT");
  }

  if (sort) {
    searchParams.push("SORTBY");
    searchParams.push(sort.field);
    searchParams.push(sort.direction || "ASC");
  }

  const searchResult = await client.ftSearch(searchParams);
  const [totalResults, ...rows] = searchResult;

  return { totalResults, offset: offsetValue, limit: limitValue, rows };
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
const asyncFtSugget = async ({ dictonary, searchText, max, fuzzy }) => {
  const queryString = [dictonary, searchText];

  if (fuzzy) {
    queryString.push("FUZZY");
  }

  if (max) {
    queryString.push("MAX");
    queryString.push(max);
  }

  queryString.push("WITHSCORES");

  const suggestions = await client.ftSugget(queryString);
  const field = dictonary.split(":")[2];
  return suggestions
    ? createSuggestionData(suggestions, [], { dictonary, field })
    : [];
};

// Add an element to a Redisearch suggestion dictonary
const asyncFtSugadd = async ({ dictonary, term, increase }) => {
  const queryString = [dictonary, term, 1];
  if (increase) {
    queryString.push("INCR");
  }

  return client.ftSugadd(queryString);
};

module.exports = {
  client: client.client,
  formatQueryResult,
  asyncFtSearch,
  asyncHgetall,
  asyncFtSugget,
  asyncFtSugadd,
};
