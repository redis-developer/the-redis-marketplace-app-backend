const { asyncFtSearch, asyncHgetall } = require("./db");

const projectIndexName = "idx:project";

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

module.exports = {
  getProject,
  listProjects,
  projectIndexName,
};
