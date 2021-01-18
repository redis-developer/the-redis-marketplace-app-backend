const { projectFilters, projectArrayFields } = require("../../config");
const utils = require("../../utils");
const db = require("./db");

const { ResponseError } = utils;

const projectIndexName = "idx:project";
const appNameDictName = "auto:projects:app_name";
const descDictName = "auto:projects:description";

const listProjects = async ({ filter, sort, highlight, limit, offset }) => {
  const queryString = filter.length > 0 ? filter.join(" ") : "*";

  const { executeTime, functionResponse } = await utils.execTimeLogger(() =>
    db.asyncFtSearch(projectIndexName, {
      queryString,
      sort,
      limit,
      highlight,
      offset,
    })
  );

  const { rows, ...rest } = functionResponse;
  const formatedRows = db.formatQueryResult(rows, [], projectArrayFields);
  return { ...rest, executeTime, rows: formatedRows };
};

const getProject = async (hashId) => {
  const hash = await db.asyncHgetall(hashId);
  return db.createRowData(Object.entries(hash).flat(), {}, projectArrayFields);
};

const getProjectSuggestions = async ({ searchText, max, fuzzy }) => {
  const suggestions = await Promise.all([
    db.asyncFtSugget({ dictonary: appNameDictName, searchText, max, fuzzy }),
    db.asyncFtSugget({ dictonary: descDictName, searchText, max, fuzzy }),
  ]);

  return suggestions
    .flat()
    .sort(({ score: scoreA }, { score: scoreB }) => scoreB - scoreA)
    .slice(0, max || 5);
};

const incrSuggestionWeight = async ({ dictonary, term }) => {
  const suggestions = await db.asyncFtSugget({
    dictonary,
    searchText: term,
    max: 1,
  });

  if (suggestions.length === 0) {
    throw new ResponseError("Incorrect dictonary and term pair", 422);
  }

  return db.asyncFtSugadd({ dictonary, term, increase: true });
};

const getProjectFilters = async () => {
  const listOfFilters = await new Promise((resolve, reject) => {
    db.client
      .multi(projectFilters.map((filter) => ["LRANGE", filter, 0, -1]))
      .exec((err, filters) => {
        if (err) {
          reject(err);
        } else {
          resolve(filters);
        }
      });
  });

  return listOfFilters.reduce(
    (prev, curr, i) => ({
      ...prev,
      ...{ [projectFilters[i]]: curr },
    }),
    {}
  );
};

module.exports = {
  getProject,
  listProjects,
  getProjectSuggestions,
  getProjectFilters,
  incrSuggestionWeight,
  projectIndexName,
  appNameDictName,
  descDictName,
};
