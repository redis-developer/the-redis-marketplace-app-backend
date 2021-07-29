const {
  get: _get,
  omit: _omit,
  difference: _difference,
  size: _size,
  uniq: _uniq,
  toLower: _toLower,
  pullAll: _pullAll,
} = require("lodash");
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
} = require("../models/client");

const { joiOptions, joiSchemas } = require("../../validation");

const {
  joiObjectRequired,
  joiStringRequired,
  joiStringNullabe,
  joiUriRequired,
  joiUriNullable,
  joiArrayNullable,
  joiStringOrInteger,
} = joiSchemas;

const { escapeQueryString } = require("../../utils");
// const createDocumentation = require("./createDocumentation");
const { joiBoolean } = require("../../validation/joiSchemas");
const { crawlerLoginName } = require("../../config/gitHubConfig");

const getRedisList = (key) => lRange(key, 0, -1);
const removeFromRedisList = (key, element) => lRem(key, 0, element);
const redisArrayDelimiter = ", ";
const dictionaryPrefix = "auto:projects";

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
    deploy_buttons: joiArrayNullable([]),
    language: joiArrayNullable([joiStringNullabe]),
    redis_commands: joiArrayNullable([joiStringNullabe]),
    redis_features: joiArrayNullable([joiStringNullabe]),
    redis_modules: joiArrayNullable([joiStringNullabe]),
    app_image_urls: joiArrayNullable([joiUriNullable]),
    youtube_url: joiUriNullable,
    special_tags: joiArrayNullable([joiStringNullabe]),
    verticals: joiArrayNullable([joiStringNullabe]),
    markdown: joiUriRequired,
    hidden: joiBoolean,
    featured: joiBoolean,
    rank: joiStringOrInteger,
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
      login: crawlerLoginName,
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

      const marketplaceJsonString = _get(repoEdge, "node.object.text", null);

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

      const hidden = _get(parsedMarketplace, "hidden", false);

      if (parsedMarketplace && hidden) {
        // skip import
        logger.info(
          parsedMarketplace,
          "Skipping marketplace file due to hidden status: "
        );
      }

      if (parsedMarketplace && !jsonParseError && !hidden) {
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

    // SKIP docusautus update
    // insert readme
    // await createDocumentation(marketplaceLists);

    // insert projects
    const projectInsertPromises = marketplaceLists.map((list) => {
      const { repoName } = list;

      const projectsToCreate = _difference(marketplaceRepos, dbProjects);
      // logger.info({ projectsToCreate });

      const projectHash = `project:${repoName}`;

      const mappedList = _omit(
        {
          ...list,
          app_name: escapeQueryString(list.app_name),
          description: escapeQueryString(list.description),
          type: escapeQueryString(list.type),
          contributed_by: escapeQueryString(list.contributed_by),
          quick_deploy: escapeQueryString(list.quick_deploy),
          deploy_buttons: JSON.stringify(list.deploy_buttons),
          app_image_urls: JSON.stringify(list.app_image_urls),
          language: escapeQueryString(list.language.join(redisArrayDelimiter)),
          redis_commands: _get(list, "redis_commands", [])
            .map(escapeQueryString)
            .join(redisArrayDelimiter),
          redis_features: _get(list, "redis_features", [])
            .map(escapeQueryString)
            .join(redisArrayDelimiter),
          redis_modules: _get(list, "redis_modules", [])
            .map(escapeQueryString)
            .join(redisArrayDelimiter),
          special_tags: _get(list, "special_tags", [])
            .map(escapeQueryString)
            .join(redisArrayDelimiter),
          verticals: _get(list, "verticals", [])
            .map(escapeQueryString)
            .join(redisArrayDelimiter),
          rank: +list.rank || 10000000,
        },
        "repoName"
      );

      const projectKeysValuePairs = Object.entries(mappedList).flat();

      // add a score if importing new project
      if (projectsToCreate.includes(repoName)) {
        projectKeysValuePairs.push("__score", 1);
      }

      return hSet(projectHash, projectKeysValuePairs);
    });

    // insert dictionaries
    const appNameDictionaryPromises = marketplaceLists.map((list) =>
      ftSugAdd(`${dictionaryPrefix}:app_name`, list.app_name, 1)
    );

    const descriptionDictionaryPromises = marketplaceLists.map((list) =>
      ftSugAdd(`${dictionaryPrefix}:description`, list.description, 1)
    );

    // update tags
    const tagKeys = [
      "redis_commands",
      "redis_features",
      "redis_modules",
      "special_tags",
      "verticals",
    ];
    const marketplaceTagPromises = [];
    /* eslint-disable no-restricted-syntax */
    for (const tag of tagKeys) {
      // get tags from db
      const tagList = await getRedisList(tag);

      // collect tags from repos
      const marketPlaceTags = marketplaceLists.flatMap((list) =>
        _get(list, tag, [])
      );

      // get unique tags
      let uniqueMarketPlaceTags = _uniq(marketPlaceTags);

      // filter lowercase duplicates for certain tags
      if (["redis_features", "verticals"].includes(tag)) {
        const lowerCase = uniqueMarketPlaceTags.map(_toLower);

        const bucket = [];
        const duplicate = [];
        lowerCase.forEach((item) => {
          if (bucket.includes(item)) {
            duplicate.push(item);
          }
          bucket.push(item);
        });

        uniqueMarketPlaceTags = _pullAll(uniqueMarketPlaceTags, duplicate);
      }

      // compate repos to db
      const marketplaceTagsToAdd = _difference(uniqueMarketPlaceTags, tagList);
      const marketplaceTagsToRemove = _difference(
        tagList,
        uniqueMarketPlaceTags
      );

      // add and remove
      const rPushPromises = marketplaceTagsToAdd.map(
        (item) => _size(item) && rPush(tag, item)
      );

      const lRemPromises = marketplaceTagsToRemove.map(
        (item) => _size(item) && removeFromRedisList(tag, item)
      );

      marketplaceTagPromises.push(...rPushPromises, ...lRemPromises);
    }

    logger.info(`Inserting ${marketplaceLists.length} projects to db.`);

    await Promise.all([
      ...removeSuggestionPromises,
      ...removeProjectPromises,
      ...projectInsertPromises,
      ...appNameDictionaryPromises,
      ...descriptionDictionaryPromises,
      ...marketplaceTagPromises,
    ]);

    logger.info(marketplaceLists, `The following projects were saved to db:`);
    return marketplaceLists;
  }

  logger.warn("Redis connection fialed!");
  throw Error("Unable to connect to redis!");
};
