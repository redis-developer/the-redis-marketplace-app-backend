const joi = require("joi");

const joiObject = (object) => joi.object().keys(object);
const joiObjectRequired = (object) => joi.object().keys(object).required();
const joiString = joi.string();
const joiStringNullabe = joiString.allow(null, "");
const joiStringRequired = joiString.required();
const joiBooleanRequired = joi.boolean().required();
const joiEmailRequired = joiStringRequired.email();
const joiInteger = joi.number().integer();
const joiIntegerRequired = joiInteger.required();
const joiEnumRequired = (enumValues) => joiStringRequired.valid(...enumValues);
const joiArrayRequired = (items) => joi.array().items(items).required();
const joiDateRequired = joiStringRequired.isoDate();

module.exports = {
  joiObject,
  joiObjectRequired,
  joiStringRequired,
  joiBooleanRequired,
  joiEmailRequired,
  joiString,
  joiIntegerRequired,
  joiEnumRequired,
  joiStringNullabe,
  joiArrayRequired,
  joiDateRequired,
  joiInteger,
};
