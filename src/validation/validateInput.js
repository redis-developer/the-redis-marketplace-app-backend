const { joiOptions } = require("./joiOptions");
const { ResponseError } = require("../utils");

const validateInput = async (data, joiSchema, options) => {
  try {
    return await joiSchema.validateAsync(data, { ...joiOptions, ...options });
  } catch (err) {
    throw new ResponseError(`Invalid input: ${err.message}`, 422);
  }
};

module.exports = validateInput;
