## To start the API run the following command:

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
