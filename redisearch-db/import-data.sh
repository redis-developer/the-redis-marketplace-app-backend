

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so --daemonize yes && sleep 2

redis-cli -p 6379 < /data/import_projets.redis

redis-cli -p 6379 < /data/import_create_index.redis

redis-cli save 

redis-cli shutdown 

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so 
