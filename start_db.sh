#!/usr/bin/env bash

ENDPOINT="https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt"
DIR="./dynamodb_local_latest"
TARBALL="$DIR.tar.gz"

if [[ ! -d $DIR ]]; then
  mkdir -p "$DIR/third_party_licenses" "$DIR/DynamoDBLocal_lib"
  curl "$ENDPOINT/$TARBALL" | tar zxf -C=$DIR - 
fi

java -D"java.library.path=$DIR/DynamoDBLocal_lib" -jar "$DIR/DynamoDBLocal.jar" -sharedDb

sleep 5