const { map: _map } = require("lodash");

const { listProjects } = require("../models/project");
const { projectLanguageTypes, projectProductTypes } = require("../../config");
const { joiSchemas, validateInput } = require("../../validation");
const {
  joiInteger,
  joiStringNullabe,
  joiArrayNullable,
} = require("../../validation/joiSchemas");

const { joiObjectRequired } = joiSchemas;

const getProjectsEndpoint = "/projects";

const getProjectsHandler = async (req, res, next) => {
  try {
    const queryParamSchema = joiObjectRequired({
      limit: joiInteger,
      offset: joiInteger,
      sortBy: joiStringNullabe,
      sortDirection: joiStringNullabe,
      language: joiArrayNullable(projectLanguageTypes),
      product: joiArrayNullable(projectProductTypes),
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

    const sort = { field: sortBy || "title", direction: sortDirection };
    const tags = _map(
      tagParams,
      (values, key) => `@${key}:{${values.join(" | ")}}`
    ).flat();

    const projects = await listProjects({ limit, offset, sort, tags });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjectsEndpoint, getProjectsHandler };
