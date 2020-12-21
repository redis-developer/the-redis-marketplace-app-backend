const logger = require("../logger");

let shuttingDown = false;

const gracefulShutdown = (server) => async () => {
  logger.info("Got kill signal, starting graceful shutdown");
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  server.close((err) => {
    if (err) {
      logger.error("Error happend during graceful shutdown: %s", err);
      process.exit(1);
    }
    logger.info("Graceful shutdown finished.");
    process.exit(0);
  });
};

module.exports = gracefulShutdown;
