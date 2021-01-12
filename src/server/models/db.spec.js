const { expect } = require("chai");
const sinon = require("sinon");
const rw = require("rewire");

const sandbox = sinon.createSandbox();
const reviredDbModel = rw("./db.js");

describe("DB model file", () => {
  const clientStub = sandbox.stub();

  /* eslint-disable-next-line no-underscore-dangle */
  reviredDbModel.__set__("client", clientStub);

  afterEach(() => {
    sandbox.reset();
  });

  describe("asyncFtSearch function", () => {
    const indexName = "idx:random";
    const queryString = "some string";
    const offset = 1;
    const limit = 1;
    const sortField = "Field";
    const ftSearchStub = sandbox.stub();
    clientStub.ftSearch = ftSearchStub;

    it("should call ftSearch with the appropriate arquments", async () => {
      ftSearchStub.returns([]);

      await reviredDbModel.asyncFtSearch(indexName, {
        offset,
        limit,
        queryString,
      });

      await reviredDbModel.asyncFtSearch(indexName, {
        sort: { field: sortField },
        limit,
        queryString,
      });

      expect(ftSearchStub.firstCall.args[0]).to.eql([
        indexName,
        queryString,
        "WITHSCORES",
        "LIMIT",
        offset,
        limit,
      ]);

      expect(ftSearchStub.secondCall.args[0]).to.eql([
        indexName,
        queryString,
        "WITHSCORES",
        "LIMIT",
        0,
        1,
        "SORTBY",
        sortField,
        "ASC",
      ]);
    });

    it("should return totalResults and rows", async () => {
      ftSearchStub.returns([2, 1, 2]);

      const searchRes = await reviredDbModel.asyncFtSearch(indexName, {
        offset,
        limit,
        queryString,
      });

      expect(searchRes).to.eql({
        totalResults: 2,
        limit,
        offset,
        rows: [1, 2],
      });
    });
  });

  describe("asyncFtSugget function", () => {
    const dictonary = "auto:index:field";
    const searchText = "Text";
    const max = 1;
    const fuzzy = true;
    const ftSuggetStub = sandbox.stub();
    clientStub.ftSugget = ftSuggetStub;

    it("should call ftSugget with the appropriate arquments", async () => {
      ftSuggetStub.returns([]);

      await reviredDbModel.asyncFtSugget({
        dictonary,
        searchText,
        max,
        fuzzy,
      });

      await reviredDbModel.asyncFtSugget({
        dictonary,
        searchText,
      });

      expect(ftSuggetStub.firstCall.args).to.eql([
        [dictonary, searchText, "FUZZY", "MAX", max, "WITHSCORES"],
      ]);

      expect(ftSuggetStub.secondCall.args).to.eql([
        [dictonary, searchText, "WITHSCORES"],
      ]);
    });

    it("should return the formated suggestions", async () => {
      const field = dictonary.split(":")[2];
      ftSuggetStub.returns(["A", 1, "B", 2]);

      const suggestions = await reviredDbModel.asyncFtSugget({
        dictonary,
        searchText,
        max,
        fuzzy,
      });

      expect(suggestions).to.eql([
        { score: 1, suggestion: "A", dictonary, field },
        { score: 2, suggestion: "B", dictonary, field },
      ]);
    });
  });

  describe("asyncFtSugadd function", () => {
    const dictonary = "auto:index:field";
    const term = "Text";
    const increase = true;
    const ftSugaddStub = sandbox.stub();
    clientStub.ftSugadd = ftSugaddStub;

    it("should call ftSugadd with the appropriate arquments", async () => {
      ftSugaddStub.returns("Result");

      await reviredDbModel.asyncFtSugadd({
        dictonary,
        term,
        increase,
      });

      await reviredDbModel.asyncFtSugadd({
        dictonary,
        term,
      });

      expect(ftSugaddStub.firstCall.args).to.eql([
        [dictonary, term, 1, "INCR"],
      ]);

      expect(ftSugaddStub.secondCall.args).to.eql([[dictonary, term, 1]]);
    });

    it("should return the the result of ftSugadd", async () => {
      ftSugaddStub.returns("Result");

      const suggAddRes = await reviredDbModel.asyncFtSugadd({
        dictonary,
        term,
      });

      expect(suggAddRes).to.eql("Result");
    });
  });
});
