const { asyncFtSearch, asyncHgetall } = require("./db");

const projectIndexName = "idx:project";

(async function () {
  const searchRes = await asyncFtSearch(projectIndexName, {
    queryString: "demonstrate",
  });
  console.log(searchRes);
  const ads = await asyncHgetall("project:1");
  console.log(ads);
})();
