const joi = require("joi");

const { joiOptions, joiSchemas } = require("../validation");

const { joiObjectRequired, joiInteger, joiStringRequired } = joiSchemas;

const serverEnvs = {
  port: process.env.PORT,
  docRepository: process.env.DOCUSAURUS_REPOSITORY,
};

const serverSchema = joiObjectRequired({
  port: joiInteger,
  docRepository: joiStringRequired,
});

const serverConfig = joi.attempt(serverEnvs, serverSchema, {
  ...joiOptions,
  convert: true,
});

module.exports = serverConfig;
