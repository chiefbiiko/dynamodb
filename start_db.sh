#!/usr/bin/env bash

set -Eeo pipefail

URL="https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz"
DIR="./dynamodb_local_latest"

if [[ ! -d $DIR ]]; then
  mkdir $DIR
  curl --progress-bar $URL | tar --directory=$DIR -zxf - 
fi

cd $DIR

java -D"java.library.path=DynamoDBLocal_lib" -jar "DynamoDBLocal.jar" -sharedDb

PID=$!

CODE=$?

printf '\nPID $PID'

exit $CODE