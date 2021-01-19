const fetchMarketplaceLists = require("../server/router/fetchMarketplaceLists");
const logger = require("../logger");

async function crawler() {
  logger.info("Starting crawler!");
  await fetchMarketplaceLists();
  logger.info("Done");
  process.exit(0);
}

crawler().catch((err) => {
  logger.error(err, "Crawler failed. Exiting with error:");
  process.exit(1);
});
