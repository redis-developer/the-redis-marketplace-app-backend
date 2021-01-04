const { Router } = require("express");

const { getProjectsHandler, getProjectsEndpoint } = require("./getProjects");

const router = new Router();

router.route(getProjectsEndpoint).get(getProjectsHandler);

module.exports = router;
