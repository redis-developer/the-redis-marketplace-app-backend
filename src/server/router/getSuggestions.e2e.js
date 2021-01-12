const { expect } = require("chai");
const supertest = require("supertest");

const app = require("../app");

describe("GET /projects/suggestion", () => {
  const request = supertest(app);
  const path = "/projects/suggestion";

  it("should return 422 on incorrect query params", async () => {
    await request
      .get(path)
      .expect(422, { error: 'Invalid input: "search_text" is required' });
  });

  it("should return 200 and the autocomplete result", async () => {
    const { body } = await request
      .get(path)
      .query({ search_text: "Dummy App 1" })
      .expect(200);

    expect(body[0]).to.include({
      suggestion: "Dummy App 1",
      dictonary: "auto:projects:app_name",
      field: "app_name",
    });

    expect(Number(body[0].score)).to.be.greaterThan(0);
  });

  it("should return 200 and max 1 autocomplete result", async () => {
    const { body } = await request
      .get(path)
      .query({ search_text: "Dummy App", max: 1 })
      .expect(200);

    expect(body.length).to.eql(1);
  });
});
