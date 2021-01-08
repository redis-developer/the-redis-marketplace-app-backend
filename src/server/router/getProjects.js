const { map: _map } = require("lodash");

const { listProjects } = require("../models/project");
const { joiSchemas, validateInput } = require("../../validation");
const {
  joiString,
  joiInteger,
  joiStringNullabe,
  joiArrayNullable,
  joiEnum,
} = require("../../validation/joiSchemas");

const { joiObjectRequired } = joiSchemas;

const getProjectsHandler = async (req, res, next) => {
  try {
    const queryParamSchema = joiObjectRequired({
      limit: joiInteger,
      offset: joiInteger,
      sortBy: joiStringNullabe,
      sortDirection: joiEnum(["ASC", "DESC"]),
      app_name: joiString,
      description: joiString,
      language: joiString,
      type: joiArrayNullable([joiString]),
      contributed_by: joiArrayNullable([joiString]),
      redis_commands: joiArrayNullable([joiString]),
      redis_features: joiArrayNullable([joiString]),
      special_tags: joiArrayNullable([joiString]),
      redis_modules: joiArrayNullable([joiString]),
    });

    const {
      sortBy,
      sortDirection,
      offset,
      limit,
      app_name: appName,
      description,
      ...tagParams
    } = await validateInput(req.query, queryParamSchema, {
      convert: true,
    });

    const sort = { field: sortBy || "app_name", direction: sortDirection };

    const textFilters = [];
    if (appName) {
      textFilters.push(`@app_name:${appName}`);
    }
    if (description) {
      textFilters.push(`@description:${description}`);
    }

    const tags = _map(
      tagParams,
      (values, key) => `@${key}:{${values.join(" | ").replace(".", "\\.")}}` // This might need update once we know all the possible escape characters
    ).flat();

    const projects = await listProjects({
      limit,
      offset,
      sort,
      filter: [...tags, ...textFilters],
    });

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

module.exports = getProjectsHandler;
