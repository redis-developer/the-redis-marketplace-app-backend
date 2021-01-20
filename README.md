## How to start the API

---

To start the API run the following command:

- `npm ci`
- `docker-compose build`
- `docker-compose up -d`
- `npm run dev`

## CI

### Trigger crawler with `POST` request

```sh
 curl \                                                                          -X POST \
  -u [username]:[personal_access_token] \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/RisingStack/redislab-marketplace-backend/dispatches  \
  -d '{"event_type":"trigger-crawler"}'
```

### Variables

- `username`: The user the personal access token belogns to.
- `personal_access_token`: A token.
- `npm run dev` or `npm start`

## OpenAPI documentation

---

The API is documented by following the OpenAPI Specification (OAS) standard. To check the documentation navigate to the `/api-docs` enpoint.

## Querying, Full-Text Search, and Autocomplete with RediSearch

---

The marketplace consists of two major components: a React frontend, which displays the search results list, and a REST API backend that queries the RediSearch DB. On the frontend, users can filter based on multiple tags such as `language`, `redis_commands`, `redis_features`, making it easy to select the desired sample applications. Apart from the tag filter component, a full-text autocompletion feature also enables users to search any phrase every `TEXT` field of the dataset. Moreover, the API also supports pagination, highlighting, and sorting.

### Creating the metadata

The metadata of each sample application is stored as a [Redis Hash](https://redis.io/topics/data-types). Hashes are maps between string fields and string values, so they are the perfect data type to represent objects. Each hashes' id is prefixed with the `project:` phrase. This way, these values can be indexed easily using RediSearch. A sample is added to the Redis DB using the [FT.CREATE](https://oss.redislabs.com/redisearch/Commands/#ftcreate) command:

```
HSET "project:1" app_name "Querying with Redisearch" description "Redisearch implements a secondery index on top of Redis\\, but unlike other Redis indexing libraries\\, it does not use internal data structures like sorted sets\\." type "Building Block" contributed_by "Redis Labs" redis_commands "FT\\.SEARCH, FT\\.SUGGET"...
```

Special characters like `,.<>{}[]"':;!@#$%^&*()-+=~ ` are escaped so we will be able to query terms with such characters. For more info on see [tokenization](https://oss.redislabs.com/redisearch/Escaping/#the_rules_of_text_field_tokenization) in the RediSearch documentation.

### Indexing the dataset

Before we can handle any search queries, we need to index the sample applications. To do this, we use a RediSearch index definition that contains all of the fields we’ll use to search. RediSearch indexes stay in sync with Hashes in your Redis database. The index definition is created using the following command:

```
FT.CREATE idx:project ON hash PREFIX 1 "project:" SCORE_FIELD __score SCHEMA app_name TEXT WEIGHT 10 SORTABLE description TEXT SORTABLE type TEXT contributed_by TEXT quick_deploy TEXT language TEXT redis_commands TEXT WEIGHT 1.5 redis_features TEXT WEIGHT 1.5 redis_modules TEXT WEIGHT 1.5 special_tags TEXT verticals TEXT
```

The `ON hash PREFIX 1 "project:"` tells the Redis DB to index each key with the `project:` prefix. The `SCORE_FIELD` flag indicates the document field that should be used as an additional weight since RediSearch will multiply the final relevance value of that document in a search query by the `__score` field. This way a document's rank in queries can be altered based on the users' ranking. After the `SCHEMA` keyword, the index fields are defined. Each field is defined as `TEXT`. This way, we can run a full-text search on the indexed fields. It comes in handy for autocompletion since a phrase a user types will be queried against the entire dataset, ensuring that Backend returns each project, which may be relevant. To guarantee that queries consider hits in specific fields more relevant, some fields are given a higher weight than the default `1`. For this reason, `app_name` weights `10`, and `redis_features`, `redis_modules`, and `redis_commands` weights `1.5`.

### Querying the dataset

The search API translates the frontend user queries into RediSearch queries. For this app, we used [prefix matching](https://oss.redislabs.com/redisearch/Query_Syntax/#prefix_matching). With prefix matching, RediSearch compares all terms in the index against the given prefix. If a user types “red” into the search form, the API will issue the prefix query `Red*`.

With prefix matching, `Red*` will find many hits, including:

- Redis
- RediSearch
- RedisAI
- RedisGraph

The search form will start displaying results for hits across all these terms as the user types. Then the `GET /projects` endpoint handles these requests. The endpoint support a list of query parameters, which will be parsed and converted into RediSearch syntax (See the Swagger documentation for more info).

If the endpoint is called without any query parameter, the backend will query the DB with the [FT.SEARCH](https://oss.redislabs.com/redisearch/Commands/#ftsearch) command and `*` as query string, making sure all documents will be listed. A simple query looks the following way:

```
FT.SEARCH idx:project * WITHSCORES
```

The `WITHSCORES` flag is always added to the query. Optionally, using the limit and offset parameters, pagination is applied for the results utilizing the `LIMIT` flag. The default value for this flag is 0 10. Sorting by `app_name` and `description` is also possible thanks to the `SORTABLE` flag on these fields using the `sortBy` query parameter. Next to `sortBy` the `sortDirection` can also be provided. These two parameters are converted to the following RediSearch syntax: `SORTBY {field} [ASC|DESC]`. By default, projects are sorted by their score.

Specific field query parameters take an Array of String as an argument. This way, it is possible to filter a particular field. These parameters are parsed based on the [query syntax](https://oss.redislabs.com/redisearch/Query_Syntax/). So the following request:

```
GET http://localhost:3000/projects?redis_commands=FT.SEARCH&contributed_by=Redis Labs&language=Javascript&language=Python
```

will result in the following RediSearch query:

```
FT.SEARCH idx:project "@redis_commands:FT\.SEARCH @contributed_by:Redis Labs @language:Javascript | Python" WITHSCORES
```

All punctuation marks and whitespaces (besides underscores) separate the document and queries into tokens. The `.` in the `FT.SEARCH` phrase hence is escaped based on the rules of [tokenization](https://oss.redislabs.com/redisearch/Escaping/). The terms separated with `|` will result in an OR condition, while the relation between the different field queries will be an AND condition. So the query above will return all hashes which language is either (`Javascript` OR `Python`) AND `FT.SEARCH` is included in their `redis_commands` field AND contributed by `Redis Labs`.

The Backend also supports a `text_filter` query param which handles autocompletion. First, it's value is escaped based on the [text field tokenization](https://oss.redislabs.com/redisearch/Escaping/#the_rules_of_text_field_tokenization) rule. Then an `*` is added to the term to enable prefix matching. At last, following request:

```
GET http://localhost:3000/projects?text_filter=Redi
```

will result in:

```
FT.SEARCH idx:project Redi*
```

This query returns all projects with a word beginning with the phrase `Redi` in any of the indexed fields. Optionally, field filters can be combined with the text filtering so that users can do a lot of flexible queries.

The endpoint also supports a `highlight` query param, which adds the `HIGHLIGH` key to the query string if provided. This is especially useful for the autocompletion since RediSearch will enclose the term with a `<b></b>` tag. So if a user types `Redi`, the Backend will return the result the following way, enclosing the `RedisGraph` term:

```json
{
  "id": "project:4",
  "score": "2.75",
  "type": "Full App",
  "redis_modules": ["Redisearch", "RedisJSON"],
  "download_url": "https://github.com/redis-developer/basic-caching-demo-nodejs/archive/main.zip",
  "markdown": "https://raw.githubusercontent.com/redislabs-training/redis-sitesearch/master/README.md",
  "verticals": ["Real estate"],
  "contributed_by": "Community",
  "redis_commands": ["FT.SEARCH", "FT.SUGGET"],
  "repo_url": "https://github.com/redis-developer/basic-caching-demo-nodejs",
  "quick_deploy": true,
  "youtube_url": "https://www.youtube.com/watch?v=B_BVmJ90X8Q",
  "language": ["Javascript"],
  "hosted_url": "",
  "app_image_urls": [
    "https://github.com/redis-developer/basic-caching-demo-nodejs/blob/main/docs/screenshot001.png?raw=true"
  ],
  "redis_features": ["caching", "search"],
  "description": "<b>RedisGraph</b> is the first queryable Property Graph database to use sparse matrices to represent the adjacency matrix in graphs and linear algebra to query the graph.",
  "app_name": "<b>RedisGraph</b>, Based on the Property Graph Model",
  "deploy_buttons": [
    {
      "heroku": "https://heroku.com/deploy?template=https://github.com/redis-developer/basic-caching-demo-nodejs"
    },
    {
      "vercel": "https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fredis-developer%2Fbasic-caching-demo-nodejs&env=REDIS_ENDPOINT_URI,REDIS_PASSWORD&envDescription=REDIS_ENDPOINT_URI%20is%20required%20at%20least%20to%20connect%20to%20Redis%20clouding%20server"
    },
    {
      "Google": "https://deploy.cloud.run/?git_repo=https://github.com/redis-developer/basic-caching-demo-nodejs.git"
    }
  ],
  "special_tags": ["Paid"]
}
```
