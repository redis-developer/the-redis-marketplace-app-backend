const { get: _get, omit: _omit, difference: _difference } = require("lodash");
const gitHubGraphQlClient = require("../models/gitHub");
const logger = require("../../logger");
const {
  client,
  ftSugadd: ftSugAdd,
  hSet,
  hMget,
  redisScan,
  ftSugDel,
  rPush,
  lRange,
  lRem,
  removeRedisKey,
} = require("../models/db");

const { joiOptions, joiSchemas } = require("../../validation");

const {
  joiObjectRequired,
  joiStringRequired,
  joiStringNullabe,
  joiUriRequired,
  joiUriNullable,
  joiArrayNullable,
  joiArrayRequired,
} = joiSchemas;

const getRedisList = (key) => lRange(key, 0, -1);
const removeFromRedisList = (key, element) => lRem(key, 0, element);
const redisArrayDelimiter = ", ";
const dictionaryPrefix = "auto:projects";

const mockJsonString =
  '{"app_name":"Basic Redis caching example in Nodejs","description":"Showcases how to impliment caching in NodeJS","type":"Building Block","contributed_by":"Redis Labs","repo_url":"https://github.com/redis-developer/basic-caching-demo-nodejs","download_url":"https://github.com/redis-developer/basic-caching-demo-nodejs/archive/main.zip","hosted_url":"","quick_deploy":"true","deploy_buttons":[{"heroku":"https://heroku.com/deploy?template=https://github.com/redis-developer/basic-caching-demo-nodejs"},{"vercel":"https://vercel.com/new/git/external?repository-url=https%3A%…20at%20least%20to%20connect%20to%20Redis%20clouding%20server"},{"Google":"https://deploy.cloud.run/?git_repo=https://github.com/redis-developer/basic-caching-demo-nodejs.git"}],"language":["JavaScript"],"redis_commands":["SETEX"],"redis_features":["caching"],"redis_modules":[],"app_image_urls":["https://github.com/redis-developer/basic-caching-demo-nodejs/blob/main/docs/screenshot001.png?raw=true"],"youtube_url":"","special_tags":[],"verticals":["Healthcare","Financial"],"markdown":"https://raw.githubusercontent.com/redislabs-training/redis-sitesearch/master/README.md"}';

module.exports = async () => {
  const repoQuery = `query($login: String!, $after: String, $first: Int!) {
    repositoryOwner(login: $login) {
      repositories(after: $after, first: $first, orderBy: { direction: ASC, field: NAME }) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
        edges {
          node {
            name
            object(expression: "HEAD:marketplace.json") {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }`;

  const marketplaceSchema = joiObjectRequired({
    app_name: joiStringRequired,
    description: joiStringRequired,
    type: joiStringRequired,
    contributed_by: joiStringRequired,
    repo_url: joiUriRequired,
    download_url: joiUriRequired,
    hosted_url: joiUriNullable,
    quick_deploy: joiStringRequired,
    deploy_buttons: joiArrayRequired([joiObjectRequired()]),
    language: joiArrayNullable([joiStringNullabe]),
    redis_commands: joiArrayNullable([joiStringNullabe]),
    redis_features: joiArrayNullable([joiStringNullabe]),
    redis_modules: joiArrayNullable([joiStringNullabe]),
    app_image_urls: joiArrayNullable([joiUriNullable]),
    youtube_url: joiUriNullable,
    special_tags: joiArrayNullable([joiStringNullabe]),
    verticals: joiArrayNullable([joiStringNullabe]),
    markdown: joiUriRequired,
  });

  let after = null;
  let hasNextPage = true;
  const marketplaceLists = [];
  let page = 1;
  const first = 100;
  let totalCount;

  while (hasNextPage) {
    /* eslint-disable no-await-in-loop */
    const repoResponse = await gitHubGraphQlClient.request(repoQuery, {
      login: "redis-developer",
      first,
      after,
    });

    const repoEdges = _get(
      repoResponse,
      "repositoryOwner.repositories.edges",
      []
    );

    repoEdges.forEach((repoEdge) => {
      const repoName = _get(repoEdge, "node.name", null);

      // mock parse check
      // const marketplaceJsonString = _get(repoEdge, "node.object.text", null);
      let marketplaceJsonString = _get(repoEdge, "node.object.text", null);
      if (marketplaceJsonString) {
        marketplaceJsonString = mockJsonString;
      }

      let jsonParseError;
      let parsedMarketplace;
      try {
        parsedMarketplace = JSON.parse(marketplaceJsonString);
      } catch (err) {
        jsonParseError = err;
      }

      if (jsonParseError) {
        logger.error(jsonParseError);
        logger.warn(
          `Skipping marketplace file due to invalid json: ${marketplaceJsonString}`
        );
      }

      if (parsedMarketplace && !jsonParseError) {
        const marketplaceValidation = marketplaceSchema.validate(
          parsedMarketplace,
          joiOptions
        );

        const validMarketplace = _get(marketplaceValidation, "value", null);
        const marketplaceValidationError = _get(
          marketplaceValidation,
          "error",
          null
        );

        if (marketplaceValidationError) {
          logger.error(marketplaceValidationError);
          logger.warn(
            parsedMarketplace,
            `Skipping marketplace file due to invalid schema:`
          );
        } else {
          marketplaceLists.push({
            ...validMarketplace,
            repoName,
          });
        }
      }
    });

    hasNextPage = _get(
      repoResponse,
      "repositoryOwner.repositories.pageInfo.hasNextPage",
      false
    );
    after = _get(
      repoResponse,
      "repositoryOwner.repositories.pageInfo.endCursor",
      null
    );

    totalCount = repoResponse.repositoryOwner.repositories.totalCount;
    const totalPages = Math.ceil(totalCount / first);
    logger.info(`Fetching page ${page} of ${totalPages}`);
    page += 1;
  }

  logger.info(`Fetched a total of ${totalCount} results.`);

  if (client.connected) {
    // remove projects and suggestions
    const marketplaceRepos = marketplaceLists.map((list) => list.repoName);

    const dbProjects = [];
    let scanCursor = "init";

    while (scanCursor) {
      if (scanCursor === "init") {
        scanCursor = 0;
      }
      const scanResponse = await redisScan(scanCursor, "match", "project*");
      scanCursor = Number(_get(scanResponse, "[0]", 0));
      const projectNames = _get(scanResponse, "[1]", []).map(
        (projectHash) => projectHash.split(":")[1]
      );
      dbProjects.push(...projectNames);
    }

    const projectsToRemove = _difference(dbProjects, marketplaceRepos);

    // remove suggestions before projects
    const removeSuggestionPromises = [];
    /* eslint-disable no-restricted-syntax */
    for (const projectName of projectsToRemove) {
      const sugestionKeys = ["description", "app_name"];
      const removeDesciption = await hMget(
        `project:${projectName}`,
        ...sugestionKeys
      );
      sugestionKeys.forEach((key, i) => {
        const removePromise = ftSugDel(
          `${dictionaryPrefix}:${key}`,
          removeDesciption[i]
        );
        removeSuggestionPromises.push(removePromise);
      });
    }

    const removeProjectPromises = projectsToRemove.map((projectName) =>
      removeRedisKey(`project:${projectName}`)
    );

    // insert projects
    const projectInsertPromises = marketplaceLists.map((list) => {
      const { repoName } = list;

      const projectsToCreate = _difference(marketplaceRepos, dbProjects);
      logger.info({ projectsToCreate });

      const projectHash = `project:${repoName}`;
      const mappedList = _omit(
        {
          ...list,
          deploy_buttons: JSON.stringify(list.deploy_buttons),
          app_image_urls: JSON.stringify(list.app_image_urls),
          language: list.language.join(redisArrayDelimiter),
          redis_commands: list.redis_commands.join(redisArrayDelimiter),
          redis_features: list.redis_features.join(redisArrayDelimiter),
          redis_modules: list.redis_modules.join(redisArrayDelimiter),
          special_tags: list.special_tags.join(redisArrayDelimiter),
          verticals: list.verticals.join(redisArrayDelimiter),
        },
        "repoName"
      );

      const projectKeysValuePairs = Object.entries(mappedList).flat();

      // add a score if importing new project
      if (projectsToCreate.includes(repoName)) {
        projectKeysValuePairs.push("__score", 1);
      }

      logger.info({ mappedList });

      return hSet(projectHash, projectKeysValuePairs);
    });

    // insert dictionaries
    const appNameDictionaryPromises = marketplaceLists.map((list) =>
      ftSugAdd(`${dictionaryPrefix}:app_name`, list.app_name, 1)
    );

    const descriptionDictionaryPromises = marketplaceLists.map((list) =>
      ftSugAdd(`${dictionaryPrefix}:description`, list.description, 1)
    );

    // insert tags
    const tagKeys = [
      "redis_commands",
      "redis_features",
      "redis_modules",
      "special_tags",
      "verticals",
    ];

    const redisCommandPromises = [];
    /* eslint-disable no-restricted-syntax */
    for (const tag of tagKeys) {
      const tagList = await getRedisList(tag);
      const marketPlaceReidsCommands = marketplaceLists.flatMap((list) =>
        _get(list, tag, [])
      );
      const redisCommandsToAdd = _difference(marketPlaceReidsCommands, tagList);
      const redisCommandsToRemove = _difference(
        tagList,
        marketPlaceReidsCommands
      );
      const rPushPromises = redisCommandsToAdd.map(
        (command) => command.length && rPush(tag, command)
      );

      const lRemPromises = redisCommandsToRemove.map(
        (command) => command.length && removeFromRedisList(tag, command)
      );

      redisCommandPromises.push(...rPushPromises, ...lRemPromises);
    }

    logger.info(`Inserting ${marketplaceLists.length} projects to db.`);

    await Promise.all([
      ...removeSuggestionPromises,
      ...removeProjectPromises,
      ...projectInsertPromises,
      ...appNameDictionaryPromises,
      ...descriptionDictionaryPromises,
      ...redisCommandPromises,
    ]);

    logger.info(marketplaceLists, `The followig projects were saved to db:`);
    return marketplaceLists;
  }

  logger.warn("Redis connection fialed!");
  throw Error("Unable to connect to redis!");
};
