const { map: _map } = require("lodash");

const { listProjects } = require("../models/project");
const { escapeQueryString } = require("../../utils");
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
      fuzzy: joiBoolean,
      highlight: joiBoolean,
      limit: joiInteger,
      offset: joiInteger,
      sortBy: joiStringNullabe,
      sortDirection: joiEnum(["ASC", "DESC"]),
      text_filter: joiString.min(3),
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
      highlight,
      fuzzy,
      text_filter: textFilter,
      ...tagParams
    } = await validateInput(req.query, queryParamSchema, {
      convert: true,
    });

    const sort = sortBy && {
      field: sortBy || "app_name",
      direction: sortDirection,
    };

    const filter = [];
    if (textFilter) {
      const queryText = escapeQueryString(textFilter);
      const filterText = fuzzy ? `%${queryText}%` : `${queryText}*`;
      filter.push(`@app_name|description:${filterText}`);
    }

    const tagFilters = _map(
      tagParams,
      (values, key) =>
        `@${key}:{${values
          .map((value) => escapeQueryString(value))
          .join(" | ")}}`
    );

    const projects = await listProjects({
      limit,
      offset,
      highlight,
      sort,
      filter: [...filter, ...tagFilters],
    });

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

module.exports = getProjectsHandler;
