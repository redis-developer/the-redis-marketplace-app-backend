const { getProjectSuggestions } = require("../models/project");
const { joiSchemas, validateInput } = require("../../validation");
const {
  joiInteger,
  joiStringRequired,
  joiBoolean,
} = require("../../validation/joiSchemas");

const { joiObjectRequired } = joiSchemas;

const getSuggestionsHandler = async (req, res, next) => {
  try {
    const queryParamSchema = joiObjectRequired({
      search_text: joiStringRequired,
      max: joiInteger,
      fuzzy: joiBoolean,
    });

    const { search_text: searchText, max, fuzzy } = await validateInput(
      req.query,
      queryParamSchema,
      {
        convert: true,
      }
    );

    const suggestions = await getProjectSuggestions({ searchText, max, fuzzy });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};

module.exports = getSuggestionsHandler;
