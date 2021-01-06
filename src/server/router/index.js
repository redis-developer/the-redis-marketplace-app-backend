const { Router } = require("express");

const getProjectsHandler = require("./getProjects");
const getSuggestionsHandler = require("./getSuggestions");
const postSuggestionsHandler = require("./postSuggestions");

const router = new Router();

router.route("/projects").get(getProjectsHandler);
router.route("/projects/suggestion").get(getSuggestionsHandler);
router.route("/projects/suggestion").post(postSuggestionsHandler);

module.exports = router;
