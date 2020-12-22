const express = require("express");
const pino = require("express-pino-logger");

const logger = require("../logger");

const app = express();

app.use(pino({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res) => {
  require("./models/project");
  res.json({ status: "OK" });
});

module.exports = app;
