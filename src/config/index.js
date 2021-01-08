require("dotenv").config();

const serverConfig = require("./serverConfig");
const dbConfig = require("./dbConfig");

const projectFilters = [
  "redis_modules",
  "redis_commands",
  "redis_features",
  "special_tags",
];

const projectArrayFields = [
  "app_image_urls",
  "redis_modules",
  "redis_commands",
  "redis_features",
  "special_tags",
];

module.exports = {
  projectArrayFields,
  projectFilters,
  serverConfig,
  dbConfig,
};
