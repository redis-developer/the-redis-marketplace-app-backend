const { incrSuggestionWeight } = require("../models/project");
const { joiSchemas, validateInput } = require("../../validation");
const { joiStringRequired } = require("../../validation/joiSchemas");

const { joiObjectRequired } = joiSchemas;

const postSuggestionsHandler = async (req, res, next) => {
  try {
    const bodySchema = joiObjectRequired({
      term: joiStringRequired,
      dictonary: joiStringRequired,
    });

    const body = await validateInput(req.body, bodySchema, {
      convert: true,
    });

    await incrSuggestionWeight(body);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

module.exports = postSuggestionsHandler;
