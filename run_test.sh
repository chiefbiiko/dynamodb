#!/usr/bin/env bash

chmod +x ./start_db.sh

# if no one is listening start the db
exec 6<>/dev/tcp/127.0.0.1/8000 || ./start_db.sh & 

# TODO: find a way to kill both the db and child bash process
PID=$!

exec 6>&- # close output connection
exec 6<&- # close input connection

ACCESS_KEY_ID=dummy SECRET_ACCESS_KEY=dummy \
  deno run --allow-env --allow-net --allow-read ./test.ts
  
CODE=$?

# TODO: kill softly - ignore failures
kill -9 $PID

sleep 5

exit $CODE