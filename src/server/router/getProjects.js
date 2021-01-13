const { map: _map } = require("lodash");

const { listProjects } = require("../models/project");
const { joiSchemas, validateInput } = require("../../validation");
const {
  joiString,
  joiInteger,
  joiBoolean,
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
      text_filter: joiString,
      verticals: joiArrayNullable([joiString]),
      language: joiArrayNullable([joiString]),
      quick_deploy: joiArrayNullable([joiBoolean]),
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
      text_filter: textFilter,
      description,
      ...tagParams
    } = await validateInput(req.query, queryParamSchema, {
      convert: true,
    });

    const sort = { field: sortBy || "app_name", direction: sortDirection };

    const textFilters = textFilter
      ? [`@app_name|description:"${textFilter}"`]
      : [];

    const tags = _map(
      tagParams,
      (values, key) =>
        `@${key}:{${values
          .map((value) =>
            String(value).replace(/[:!@#.*+?^${}()|[\]\\]/g, "\\$&")
          )
          .join(" | ")}}`
    );

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
