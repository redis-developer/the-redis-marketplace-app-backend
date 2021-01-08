const { projectFilters, projectArrayFields } = require("../../config");
const { ResponseError } = require("../../utils");
const {
  asyncFtSearch,
  asyncHgetall,
  asyncFtSugget,
  asyncFtSugadd,
  formatQueryResult,
  client,
} = require("./db");

const projectIndexName = "idx:project";
const appNameDictName = "auto:projects:app_name";
const descriptionDictName = "auto:projects:description";

const listProjects = async ({ filter, sort, limit, offset }) => {
  const queryString = filter.length > 0 ? filter.join(" ") : "*";

  const { totalResults, rows } = await asyncFtSearch(projectIndexName, {
    queryString,
    sort,
    limit,
    offset,
  });

  const formatedRows = formatQueryResult(rows, [], projectArrayFields);
  return { totalResults, rows: formatedRows };
};

const getProject = (hashId) => asyncHgetall(hashId);

const getProjectSuggestions = async ({ searchText, max, fuzzy }) => {
  const suggestions = await Promise.all([
    asyncFtSugget(appNameDictName, searchText, max, fuzzy),
    asyncFtSugget(descriptionDictName, searchText, max, fuzzy),
  ]);

  return suggestions
    .flat()
    .sort(({ score: scoreA }, { score: scoreB }) => scoreB - scoreA);
};

const incrSuggestionWeight = async ({ dictonary, term }) => {
  const suggestions = await asyncFtSugget(dictonary, term, 1);
  if (suggestions.length === 0) {
    throw new ResponseError("Incorrect dictonary and term pair", 422);
  }

  return asyncFtSugadd(dictonary, term, true);
};

const getProjectFilters = async () => {
  const listOfFilters = await new Promise((resolve, reject) => {
    client
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
  descriptionDictName,
};
