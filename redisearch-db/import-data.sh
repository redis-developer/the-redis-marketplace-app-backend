

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so --daemonize yes && sleep 2

redis-cli -p 6379 < /data/create_index.redis
redis-cli -p 6379 < /data/projects.redis
redis-cli -p 6379 < /data/create_dictonaries.redis
redis-cli -p 6379 < /data/create_lists.redis

redis-cli save 

redis-cli shutdown 

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so 
