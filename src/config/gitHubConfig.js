const joi = require("joi");

const { joiSchemas, joiOptions } = require("../validation");

const { joiObjectRequired, joiStringRequired, joiUriRequired } = joiSchemas;

const { env } = process;

const gitHubEnvs = {
  gitHubToken: env.PERSONAL_ACCESS_TOKEN_GITHUB,
  gitHubGraphQlUrl: env.GITHUB_GRAPHQL_URL,
};

const gitHubConfigSchema = joiObjectRequired({
  gitHubToken: joiStringRequired,
  gitHubGraphQlUrl: joiUriRequired,
});

module.exports = joi.attempt(gitHubEnvs, gitHubConfigSchema, joiOptions);
