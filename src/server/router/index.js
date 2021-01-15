const { Router } = require("express");

const getProjectsHandler = require("./getProjects");
const getProjectByIdHandler = require("./getProjectById");
const getSuggestionsHandler = require("./getSuggestions");
const postSuggestionsHandler = require("./postSuggestions");
const getFiltersHandler = require("./getFilters");

const router = new Router();

router.route("/projects").get(getProjectsHandler);
router.route("/projects/suggestion").get(getSuggestionsHandler);
router.route("/projects/suggestion").post(postSuggestionsHandler);
router.route("/projects/filters").get(getFiltersHandler);
router.route("/projects/:id").get(getProjectByIdHandler);

module.exports = router;
