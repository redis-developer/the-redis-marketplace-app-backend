const {
  asyncFtSearch,
  asyncHgetall,
  asyncFtSugget,
  asyncFtSugadd,
} = require("./db");

const { ResponseError } = require("../../utils");

const projectIndexName = "idx:project";
const appNameDictName = "auto:projects:app_name";
const descriptionDictName = "auto:projects:description";

const listProjects = async ({ tags, sort, limit, offset }) => {
  const queryString = tags.length > 0 ? tags.join(" ") : "*";

  const projects = await asyncFtSearch(projectIndexName, {
    queryString,
    sort,
    limit,
    offset,
  });

  return projects;
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

module.exports = {
  getProject,
  listProjects,
  getProjectSuggestions,
  incrSuggestionWeight,
  projectIndexName,
  appNameDictName,
  descriptionDictName,
};
