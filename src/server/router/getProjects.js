const { map: _map } = require("lodash");

const { listProjects } = require("../models/project");
const {
  projectLanguageTypes,
  projectProductTypes,
  projectCommandTypes,
  projectModuleTypes,
  projectContributorTypes,
} = require("../../config");
const { joiSchemas, validateInput } = require("../../validation");
const {
  joiInteger,
  joiStringNullabe,
  joiArrayNullable,
  joiEnum,
} = require("../../validation/joiSchemas");

const { joiObjectRequired } = joiSchemas;

const getProjectsEndpoint = "/projects";

const getProjectsHandler = async (req, res, next) => {
  try {
    // This will be changed based on the actual searchable tags
    const queryParamSchema = joiObjectRequired({
      limit: joiInteger,
      offset: joiInteger,
      sortBy: joiStringNullabe,
      sortDirection: joiEnum(["ASC", "DESC"]),
      language: joiArrayNullable(projectLanguageTypes),
      type: joiArrayNullable(projectProductTypes),
      contributed_by: joiArrayNullable(projectContributorTypes),
      redis_commands: joiArrayNullable(projectCommandTypes),
      redis_modules: joiArrayNullable(projectModuleTypes),
    });

    const {
      sortBy,
      sortDirection,
      offset,
      limit,
      ...tagParams
    } = await validateInput(req.query, queryParamSchema, {
      convert: true,
    });

    const sort = { field: sortBy || "app_name", direction: sortDirection };
    const tags = _map(
      tagParams,
      (values, key) => `@${key}:{${values.join(" | ").replace(".", "\\.")}}` // This might need update once we know all the possible escape characters
    ).flat();

    const projects = await listProjects({ limit, offset, sort, tags });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjectsEndpoint, getProjectsHandler };
