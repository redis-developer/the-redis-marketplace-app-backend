const { Router } = require("express");

const getProjectsHandler = require("./getProjects");
const getProjectByIdHandler = require("./getProjectById");
const getSuggestionsHandler = require("./getSuggestions");
const postSuggestionsHandler = require("./postSuggestions");
const getFiltersHandler = require("./getFilters");

const router = new Router();

/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Listing projects and related filters
 *   - name: Filters
 *     description: Listing project related filters
 */

/**
 * @swagger
 * definitions:
 *   Project:
 *     properties:
 *       id:
 *         type: string
 *       score:
 *         type: number
 *       type:
 *         type: string
 *       app_name:
 *         type: string
 *       description:
 *         type: string
 *       quick_deploy:
 *         type: boolean
 *       download_url:
 *         type: string
 *       repo_url:
 *         type: string
 *       hosted_url:
 *         type: string
 *       deploy_buttons:
 *         type: array
 *         items:
 *           type: object
 *       app_image_urls:
 *         type: string
 *         items:
 *           type: string
 *       contributed_by:
 *         type: string
 *       redis_commands:
 *         type: array
 *         items:
 *           type: string
 *       redis_use_cases:
 *         type: string
 *         items:
 *           type: string
 *       special_tags:
 *         type: string
 *         items:
 *           type: string
 *   Filter:
 *    properties:
 *      redis_features:
 *        type: string
 *      redis_commands:
 *        type: array
 *        items:
 *          type: string
 *      redis_use_cases:
 *        type: array
 *        items:
 *          type: string
 *      special_tags:
 *        type: array
 *        items:
 *          type: string
 *      verticals:
 *        type: array
 *        items:
 *          type: string
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     description: Get projects
 *     tags:
 *      - Projects
 *     produces:
 *      - application/json
 *     parameters:
 *      - name: highlight
 *        description: If true, search matches are highlighted by RediSearch.
 *        in: query
 *        required: false
 *        type: boolean
 *      - name: limit
 *        description: Limits the number of results returned by RediSearch.
 *        in: query
 *        required: false
 *        type: integer
 *      - name: offset
 *        description: Offsets the results returned by the given number.
 *        in: query
 *        required: false
 *        type: integer
 *      - name: offset
 *        description: Offsets the results by the given number  !!!
 *        in: query
 *        required: false
 *        type: integer
 *      - name: sortBy
 *        description: If set, the results are sorted by the given field. By default RediSearch sorts the results by score.
 *        in: query
 *        required: false
 *        type: string
 *      - name: sortDirection
 *        description: If sortBy set, defined the direction RediSearch sorts the results by. Defaults to "ASC".
 *        in: query
 *        required: false
 *        schema:
 *          type: string
 *          enum: [ASC, DESC]
 *      - name: text_filter
 *        description: Applies a text filtering on the app_name and description fields.
 *        in: query
 *        required: false
 *        type: string
 *      - name: verticals
 *        description: Filters the returned projects by verticals.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: language
 *        description: Filters the returned projects by language.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: quick_deploy
 *        description: Filters the returned projects by quick_deploy.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: boolean
 *            - type: array
 *              items:
 *                type: boolean
 *      - name: type
 *        description: Filters the returned projects by type.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: contributed_by
 *        description: Filters the returned projects by contributed_by.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: redis_commands
 *        description: Filters the returned projects by redis_commands.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: redis_use_cases
 *        description: Filters the returned projects by redis_use_cases.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: special_tags
 *        description: Filters the returned projects by special_tags.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *      - name: redis_features
 *        description: Filters the returned projects by redis_features.
 *        in: query
 *        required: false
 *        schema:
 *          oneOf:
 *            - type: string
 *            - type: array
 *              items:
 *                type: string
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             totalResults:
 *               type: integer
 *             offset:
 *               type: integer
 *             limit:
 *               type: integer
 *             executeTime:
 *               type: number
 *             rows:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Project'
 *
 */
router.route("/projects").get(getProjectsHandler);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     description: Get a particular project by ID
 *     parameters:
 *      - name: id
 *        description: The ID of a particular project
 *        in: path
 *        required: true
 *        type: string
 *     tags:
 *      - Projects
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           $ref: '#/definitions/Project'
 *
 */
router.route("/project/:id").get(getProjectByIdHandler);

/**
 * @swagger
 * /projects/filters:
 *   get:
 *     description: Get all dynamic filter for the projects
 *     produces:
 *      - application/json
 *     tags:
 *      - Filters
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Filter'
 *
 */
router.route("/projects/filters").get(getFiltersHandler);
router.route("/projects/suggestion").get(getSuggestionsHandler);
router.route("/projects/suggestion").post(postSuggestionsHandler);

module.exports = router;
