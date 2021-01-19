const { GraphQLClient } = require("graphql-request");

const { gitHubToken, gitHubGraphQlUrl } = require("../../config/gitHubConfig");

module.exports = new GraphQLClient(gitHubGraphQlUrl, {
  headers: { Authorization: `Bearer ${gitHubToken}` },
});
