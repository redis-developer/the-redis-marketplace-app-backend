FROM redislabs/redisearch:2.0.2

COPY import-data.sh /data/import-data.sh
COPY ./dataset/create_dictonaries.redis /data/create_dictonaries.redis
COPY ./dataset/create_lists.redis /data/create_lists.redis
COPY ./dataset/projects.redis /data/projects.redis
COPY ./dataset/create_index.redis /data/create_index.redis

CMD ["sh", "/data/import-data.sh"]
