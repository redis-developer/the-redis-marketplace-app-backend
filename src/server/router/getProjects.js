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
      redis_use_cases: joiArrayNullable([joiString]),
      featured: joiString,
    });

    const {
      sortBy,
      sortDirection,
      offset,
      limit,
      highlight,
      text_filter: textFilter,
      featured,
      ...tagParams
    } = await validateInput(req.query, queryParamSchema, {
      convert: true,
    });

    const sort = sortBy && {
      field: sortBy,
      direction: sortDirection,
    };

    const filter = [];
    if (textFilter) {
      const queryText = `'${escapeQueryString(textFilter)}*'`;
      filter.push(queryText);
    }
    if (featured) {
      filter.push(`@featured:true`);
    }

    const tagFilters = _map(tagParams, (values, key) =>
      values.map((value) => `(@${key}:${escapeQueryString(value)})`).join("|")
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
