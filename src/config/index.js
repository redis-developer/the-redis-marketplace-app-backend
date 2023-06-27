require("dotenv").config();

const serverConfig = require("./serverConfig");
const dbConfig = require("./dbConfig");
const gitHubConfig = require("./gitHubConfig");

const projectFilters = [
  "redis_use_cases",
  "redis_commands",
  "redis_features",
  "special_tags",
  "verticals",
];

const projectArrayFields = [
  "app_image_urls",
  "redis_use_cases",
  "redis_commands",
  "redis_features",
  "special_tags",
  "language",
  "verticals",
];

module.exports = {
  projectArrayFields,
  projectFilters,
  serverConfig,
  dbConfig,
  gitHubConfig,
};
