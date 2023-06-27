// const { expect } = require("chai");
const supertest = require("supertest");

// const { getProjectSuggestions } = require("../models/project");
const app = require("../app");

describe("POST /projects/suggestion", () => {
  const request = supertest(app);
  const path = "/projects/suggestion";

  it("should return 422 on incorrect body", async () => {
    await request
      .post(path)
      .expect(422, { error: 'Invalid input: "term" is required' });
  });

  //   it("should return 200 and increase the weight of a suggestion", async () => {
  //     const searchText = "Dummy";
  //     const term = "Dummy App 1";
  //     const dictonary = "auto:projects:app_name";

  //     const defaultSuggestions = await getProjectSuggestions({ searchText });
  //     const { score: defaultScore } = defaultSuggestions.find(
  //       ({ suggestion }) => suggestion === term
  //     );

  //     await request.post(path).send({ dictonary, term }).expect(200);

  //     const newSuggestions = await getProjectSuggestions({
  //       searchText,
  //     });
  //     const { score: newScore } = newSuggestions.find(
  //       ({ suggestion }) => suggestion === term
  //     );

  //     expect(Number(defaultScore)).to.be.lessThan(Number(newScore));
  //   });
});
