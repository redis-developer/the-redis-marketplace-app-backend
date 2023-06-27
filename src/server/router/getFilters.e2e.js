const supertest = require("supertest");
// const { expect } = require("chai");

const app = require("../app");

describe("GET /projects/filters", () => {
  const request = supertest(app);
  const path = "/projects/filters";

  it("should return 200 and the list of filters", async () => {
    const { body } = await request.get(path).expect(200);
    console.log(body);
    // expect(body).to.eql({
    //   redis_features: [
    //     "Redis",
    //     "Search and Query",
    //     "JSON"
    //   ],
    //   redis_commands: ["FT.SEARCH", "FT.SUGADD", "FT.SUGGET", "HGETALL"],
    //   redis_use_cases: ["caching", "search", "query", "autocomplete"],
    //   special_tags: ["Hackathon", "Paid"],
    //   verticals: [
    //     "Healthcare",
    //     "Oil & gas",
    //     "Real estate",
    //     "Financial",
    //     "Tourism",
    //   ],
    // });
  });
});
