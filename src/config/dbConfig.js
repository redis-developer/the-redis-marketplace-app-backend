const joi = require("joi");

const { joiOptions } = require("../validation");
const { joiSchemas } = require("../validation");

const { joiObjectRequired, joiStringRequired } = joiSchemas;

const dbEnvs = {
  redisDbUrl: process.env.REDIS_CONNECTION_STRING,
};

const dbSchema = joiObjectRequired({
  redisDbUrl: joiStringRequired,
});

const dbCondifg = joi.attempt(dbEnvs, dbSchema, joiOptions);

module.exports = dbCondifg;
