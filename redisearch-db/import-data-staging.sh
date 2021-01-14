redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_index.redis
redis-cli -p $PORT -h $HOST -a $PASS < ./dataset/projects.redis
redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_dictonaries.redis
redis-cli -p $PORT -h $HOST -a $PASS  < ./dataset/create_lists.redis
