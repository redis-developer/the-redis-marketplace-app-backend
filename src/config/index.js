require("dotenv").config();

const serverConfig = require("./serverConfig");
const dbConfig = require("./dbConfig");

const projectLanguageTypes = ["Javascript", "Python", "Java"];
const projectProductTypes = ["Redisearch", "RedisJSON"];

module.exports = {
  serverConfig,
  dbConfig,
  projectLanguageTypes,
  projectProductTypes,
};
