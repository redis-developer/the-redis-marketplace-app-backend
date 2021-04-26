const joi = require("joi");

const { joiSchemas, joiOptions } = require("../validation");

const { joiObjectRequired, joiStringRequired, joiUriRequired } = joiSchemas;

const { env } = process;

const gitHubEnvs = {
  gitHubToken: env.PERSONAL_ACCESS_TOKEN_GITHUB,
  gitHubGraphQlUrl: env.GITHUB_GRAPHQL_URL,
  crawlerLoginName: env.CRAWLER_LOGIN_NAME,
};

const gitHubConfigSchema = joiObjectRequired({
  gitHubToken: joiStringRequired,
  gitHubGraphQlUrl: joiUriRequired,
  crawlerLoginName: joiStringRequired,
});

module.exports = joi.attempt(gitHubEnvs, gitHubConfigSchema, joiOptions);
