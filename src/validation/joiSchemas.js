const joi = require("joi");

const joiObject = (object) => joi.object().keys(object);
const joiObjectRequired = (object) => joi.object().keys(object).required();
const joiString = joi.string();
const joiStringNullabe = joiString.allow(null, "");
const joiStringRequired = joiString.required();
const joiBoolean = joi.boolean();
const joiInteger = joi.number().integer();
const joiIntegerRequired = joiInteger.required();
const joiEnum = (enumValues) => joiString.valid(...enumValues);
const joiEnumRequired = (enumValues) => joiStringRequired.valid(...enumValues);
const joiArrayNullable = (items) =>
  joi
    .array()
    .items(...items)
    .allow(null)
    .single();

module.exports = {
  joiObject,
  joiObjectRequired,
  joiStringRequired,
  joiBoolean,
  joiString,
  joiIntegerRequired,
  joiEnum,
  joiEnumRequired,
  joiStringNullabe,
  joiArrayNullable,
  joiInteger,
};
