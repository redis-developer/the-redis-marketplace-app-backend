FROM redislabs/redisearch:2.0.2

COPY import-data.sh /data/import-data.sh
COPY ./dataset/import_projects.redis /data/import_projets.redis
COPY ./dataset/import_create_index.redis /data/import_create_index.redis

CMD ["sh", "/data/import-data.sh"]
