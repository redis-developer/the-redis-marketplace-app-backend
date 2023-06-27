const { expect } = require("chai");
const sinon = require("sinon");
const rw = require("rewire");

const utils = require("../../utils");
const db = require("./db");
const { projectArrayFields, projectFilters } = require("../../config");
const {
  listProjects,
  getProject,
  getProjectSuggestions,
  incrSuggestionWeight,
  projectIndexName,
  appNameDictName,
  descDictName,
} = require("./project");

const { ResponseError } = utils;

const sandbox = sinon.createSandbox();

describe("Projects model file", () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe("listProjects  function", () => {
    const offset = 1;
    const limit = 1;
    const highlight = true;
    const sort = { field: "app_name", direction: "ASC" };
    const filter = ["@app_name:Dummy App 1"];

    it("should call asyncFtSearch with the appropriate arquments", async () => {
      const asyncFtSearchStub = sandbox
        .stub(db, "asyncFtSearch")
        .returns({ rows: [] });

      await listProjects({
        sort,
        offset,
        limit,
        filter,
        highlight,
      });

      await listProjects({
        sort,
        offset,
        limit,
        filter: [],
      });

      expect(asyncFtSearchStub.firstCall.args).to.eql([
        projectIndexName,
        { limit, offset, sort, highlight, queryString: filter.join(" ") },
      ]);

      expect(asyncFtSearchStub.secondCall.args).to.eql([
        projectIndexName,
        { limit, offset, sort, queryString: "*", highlight: undefined },
      ]);
    });

    it("should call formatQueryResult with the appropriate arquments", async () => {
      const rows = [1, 2, 3];
      const formatQueryResultStub = sandbox
        .stub(db, "formatQueryResult")
        .returns(rows);
      sandbox.stub(db, "asyncFtSearch").returns({ rows });

      await listProjects({
        sort,
        offset,
        limit,
        filter,
      });

      expect(formatQueryResultStub.firstCall.args).to.eql([
        rows,
        [],
        projectArrayFields,
      ]);
    });

    it("should call execTimeLogger with the appropriate arquments", async () => {
      const rows = [1, 2, 3];
      const totalResults = 3;
      const executeTime = 1;
      const execTimeLoggerStub = sandbox
        .stub(utils, "execTimeLogger")
        .returns({ executeTime, functionResponse: { totalResults, rows } });
      sandbox.stub(db, "asyncFtSearch").returns({ rows });
      sandbox.stub(db, "formatQueryResult").returns(rows);

      await listProjects({
        sort,
        offset,
        limit,
        filter,
      });

      expect(typeof execTimeLoggerStub.firstCall.args[0]).to.eql("function");
    });

    it("should return the result of formatQueryResult and totalResults", async () => {
      const rows = [1, 2, 3];
      const totalResults = 3;
      const executeTime = 1;
      sandbox.stub(db, "asyncFtSearch").returns({ totalResults, rows: [] });
      sandbox.stub(db, "formatQueryResult").returns(rows);
      sandbox
        .stub(utils, "execTimeLogger")
        .returns({ executeTime, functionResponse: { totalResults, rows } });

      const searchRes = await listProjects({
        sort,
        offset,
        limit,
        filter,
      });

      expect(searchRes).to.eql({ totalResults, rows, executeTime });
    });
  });

  describe("getProjectSuggestions  function", () => {
    const fuzzy = true;
    const max = 1;
    const searchText = "Some text";
    const suggestions = [{ score: 1 }, { score: 2 }];

    it("should call asyncFtSugget with the appropriate arquments", async () => {
      const asyncFtSuggetStub = sandbox
        .stub(db, "asyncFtSugget")
        .returns(suggestions);

      await getProjectSuggestions({ fuzzy, max, searchText });

      expect(asyncFtSuggetStub.firstCall.args).to.eql([
        {
          dictonary: appNameDictName,
          searchText,
          fuzzy,
          max,
        },
      ]);

      expect(asyncFtSuggetStub.secondCall.args).to.eql([
        {
          dictonary: descDictName,
          searchText,
          fuzzy,
          max,
        },
      ]);
    });

    it("should return a maximum number of suggestions", async () => {
      sandbox.stub(db, "asyncFtSugget").returns(suggestions);

      const suggestion = await getProjectSuggestions({
        fuzzy,
        max,
        searchText,
      });

      expect(suggestion).to.eql([{ score: 2 }]);
    });

    it("should return the suggestions ordered by their score", async () => {
      sandbox.stub(db, "asyncFtSugget").returns(suggestions);

      const suggestion = await getProjectSuggestions({
        fuzzy,
        max: 5,
        searchText,
      });

      expect(suggestion).to.eql([
        { score: 2 },
        { score: 2 },
        { score: 1 },
        { score: 1 },
      ]);
    });
  });

  describe("incrSuggestionWeight  function", () => {
    const dictonary = "Random dictonary";
    const term = "Some term";

    it("should call asyncFtSugget with the appropriate arquments", async () => {
      const asyncFtSuggetStub = sandbox.stub(db, "asyncFtSugget").returns([1]);
      await incrSuggestionWeight({ dictonary, term });

      expect(asyncFtSuggetStub.firstCall.args).to.eql([
        {
          dictonary,
          searchText: term,
          max: 1,
        },
      ]);
    });

    it("should call asyncFtSugadd with the appropriate arquments", async () => {
      const asyncFtSugaddStud = sandbox.stub(db, "asyncFtSugadd").returns([]);
      sandbox.stub(db, "asyncFtSugget").returns([1]);
      await incrSuggestionWeight({ dictonary, term });

      expect(asyncFtSugaddStud.firstCall.args).to.eql([
        { dictonary, term, increase: true },
      ]);
    });

    it("should throw if asyncFtSugget find no dictonary and term pair", async () => {
      sandbox.stub(db, "asyncFtSugget").returns([]);

      try {
        await incrSuggestionWeight({ dictonary, term });
      } catch (err) {
        expect(err.message).to.eql("Incorrect dictonary and term pair");
        expect(err.status).to.eql(422);
        return expect(err).to.be.an.instanceof(ResponseError);
      }

      throw Error("Test should have thrown!");
    });

    it("should return asyncFtSugadd result", async () => {
      sandbox.stub(db, "asyncFtSugadd").returns([1]);
      sandbox.stub(db, "asyncFtSugget").returns([1]);

      const resp = await incrSuggestionWeight({ dictonary, term });
      expect(resp).to.eql([1]);
    });
  });

  describe("getProjectFilters  function", () => {
    const execStub = sandbox.stub();
    const multiStub = sandbox.stub().returns({ exec: execStub });
    const clientStub = sandbox.stub();
    clientStub.multi = multiStub;
    const dbStub = sinon.stub();
    dbStub.client = clientStub;

    const reviredProjectModel = rw("./project.js");
    /* eslint-disable-next-line no-underscore-dangle */
    reviredProjectModel.__set__("db", dbStub);

    it("should call multi with the appropriate arquments", async () => {
      execStub.yields(null, []);

      await reviredProjectModel.getProjectFilters();
      expect(multiStub.firstCall.args[0]).to.eql(
        projectFilters.map((filter) => ["LRANGE", filter, 0, -1])
      );
    });

    it("should throw if the multi operation fails", async () => {
      execStub.yields("Error", []);

      try {
        await reviredProjectModel.getProjectFilters();
      } catch (err) {
        return expect(err).to.eql("Error");
      }

      throw Error("Test should have thrown!");
    });

    it("should return an object with the projectFilters keys and multi operation responses", async () => {
      execStub.yields(null, [
        ["Redis"],
        ["FT.SEARCH"],
        ["caching"],
        ["Paid"],
        ["Healthcare"],
      ]);

      const filters = await reviredProjectModel.getProjectFilters();
      expect(filters).to.eql({
        redis_features: ["Redis"],
        redis_commands: ["FT.SEARCH"],
        redis_use_cases: ["caching"],
        special_tags: ["Paid"],
        verticals: ["Healthcare"],
      });
    });
  });

  describe("getProject  function", () => {
    it("should call asyncHgetall with the appropriate arquments", async () => {
      const hashId = "1";
      const asyncHgetallStub = sandbox.stub(db, "asyncHgetall").returns({});

      await getProject(hashId);
      expect(asyncHgetallStub.firstCall.args).to.eql([hashId]);
    });

    it("should call createRowData with the appropriate arquments", async () => {
      const hashId = "1";
      const createRowDataStub = sandbox.stub(db, "createRowData").returns({});
      sandbox.stub(db, "asyncHgetall").returns({ id: hashId });

      await getProject(hashId);
      expect(createRowDataStub.firstCall.args).to.eql([
        ["id", hashId],
        {},
        projectArrayFields,
      ]);
    });

    it("should return a properly parsed hash object", async () => {
      const hashId = "1";
      sandbox.stub(db, "asyncHgetall").returns({
        id: hashId,
        score: "2",
        redis_commands: "FT.SUGGET, FT.SUGADD",
        deploy_buttons: '[{"heroku": "heroku"}]',
      });

      const project = await getProject(hashId);
      expect(project.id).to.eql(1);
      expect(project.score).to.eql(2);
      expect(project.redis_commands).to.eql(["FT.SUGGET", "FT.SUGADD"]);
      expect(project.deploy_buttons).to.eql([
        {
          heroku: "heroku",
        },
      ]);
    });
  });
});
