

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so --daemonize yes && sleep 2

redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_index.redis
redis-cli -p $PORT -h $HOST -a $PASS < ./dataset/projects.redis
redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_dictonaries.redis
redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_lists.redis

redis-cli save 

redis-cli shutdown 

redis-server --loadmodule /usr/lib/redis/modules/redisearch.so 
