const express = require("express");
const pino = require("express-pino-logger");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const logger = require("../logger");
const router = require("./router");

const app = express();

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Redislabs Marketplace API",
      version: "1.0.0",
    },
  },
  apis: ["./src/server/router/index.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(cors());
app.use(pino({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.use(router);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err);
  const errorObject = { error: err.message };
  const errorStatus = err.status || 500;
  res.status(errorStatus).json(errorObject);
});

module.exports = app;
