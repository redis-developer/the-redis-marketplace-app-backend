const { createServer } = require("http");

const logger = require("./src/logger");
const app = require("./src/server/app");
const { serverConfig } = require("./src/config");
const { gracefulShutdown } = require("./src/utils");

const port = serverConfig.port || 3000;
const http = createServer(app);

const server = http.listen(port, () => {
  logger.info(`Server is running at port: ${port}`);
});

const shutdownHandler = gracefulShutdown(server);
process.on("SIGTERM", shutdownHandler);
process.on("SIGINT", shutdownHandler);
