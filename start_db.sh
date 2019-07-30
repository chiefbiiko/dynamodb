#!/usr/bin/env bash

ENDPOINT="https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt"
DIR="./dynamodb_local_latest"
TARBALL="$DIR.tar.gz"

if [[ ! -d $DIR ]]; then
  mkdir $DIR
  curl --progress-bar "$ENDPOINT/$TARBALL" | tar --directory=$DIR -zxf - 
fi

java -D"java.library.path=$DIR/DynamoDBLocal_lib" -jar "$DIR/DynamoDBLocal.jar" -sharedDb
