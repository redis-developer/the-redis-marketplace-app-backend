require("dotenv").config();

const serverConfig = require("./serverConfig");
const dbConfig = require("./dbConfig");

const projectLanguageTypes = ["Javascript", "Python", "Java"];
const projectProductTypes = ["Redisearch", "RedisJSON"];
const projectContributorTypes = ["Redis Labs", "Community", "Partner"];
const projectCommandTypes = ["FT.SEARCH", "FT.SUGGET", "FT.SUGADD"];
const projectModuleTypes = ["Redisearch"];

module.exports = {
  serverConfig,
  dbConfig,
  projectLanguageTypes,
  projectProductTypes,
  projectContributorTypes,
  projectCommandTypes,
  projectModuleTypes,
};
