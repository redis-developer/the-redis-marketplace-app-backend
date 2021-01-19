const joi = require("joi");

const joiObject = (object) => joi.object().keys(object);
const joiObjectRequired = (object) => joi.object().keys(object).required();
const joiString = joi.string();
const joiStringNullabe = joiString.allow(null, "");
const joiStringRequired = joiString.required();
const joiUriRequired = joiString.uri().required();
const joiUriNullable = joiString.uri().allow(null, "");
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

const joiArrayRequired = (items) =>
  joi
    .array()
    .items(...items)
    .required();

module.exports = {
  joiObject,
  joiObjectRequired,
  joiStringRequired,
  joiUriRequired,
  joiUriNullable,
  joiBoolean,
  joiString,
  joiIntegerRequired,
  joiEnum,
  joiEnumRequired,
  joiStringNullabe,
  joiArrayNullable,
  joiArrayRequired,
  joiInteger,
};
