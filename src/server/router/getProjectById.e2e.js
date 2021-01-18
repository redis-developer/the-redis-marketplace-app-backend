const supertest = require("supertest");

const app = require("../app");

describe("GET /project/:id", () => {
  const request = supertest(app);

  it("should return 200 and a project", async () => {
    const path = "/project/project:1";

    await request.get(path).expect(200, {
      id: "project:1",
      type: "Building Block",
      redis_modules: ["Redisearch"],
      download_url:
        "https://github.com/redis-developer/basic-caching-demo-nodejs/archive/main.zip",
      markdown:
        "https://raw.githubusercontent.com/redislabs-training/redis-sitesearch/master/README.md",
      verticals: ["Healthcare", "Financial"],
      contributed_by: "Redis Labs",
      redis_commands: ["FT.SEARCH", "FT.SUGADD"],
      repo_url: "https://github.com/redis-developer/basic-caching-demo-nodejs",
      quick_deploy: true,
      youtube_url: "https://www.youtube.com/watch?v=B_BVmJ90X8Q",
      language: ["Ruby"],
      hosted_url: "https://www.google.com/",
      app_image_urls: [
        "https://github.com/redis-developer/basic-caching-demo-nodejs/blob/main/docs/screenshot001.png?raw=true",
      ],
      __score: 1,
      redis_features: ["caching"],
      description:
        "RediSearch is a source available Secondary Index, Query Engine and Full-Text Search over Redis, developed by Redis Labs.",
      app_name: "A Redisearch App",
      deploy_buttons: [
        {
          heroku:
            "https://heroku.com/deploy?template=https://github.com/redis-developer/basic-caching-demo-nodejs",
        },
        {
          vercel:
            "https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fredis-developer%2Fbasic-caching-demo-nodejs&env=REDIS_ENDPOINT_URI,REDIS_PASSWORD&envDescription=REDIS_ENDPOINT_URI%20is%20required%20at%20least%20to%20connect%20to%20Redis%20clouding%20server",
        },
        {
          Google:
            "https://deploy.cloud.run/?git_repo=https://github.com/redis-developer/basic-caching-demo-nodejs.git",
        },
      ],
      special_tags: ["Hackathon", "Paid"],
    });
  });

  it("should return 200 and empty {} for not existing project ID", async () => {
    const path = "/project/project:1245";
    await request.get(path).expect(200, {});
  });
});
