#!/usr/bin/env bash
cd ./dynamodb_local_latest
java -D"java.library.path=./DynamoDBLocal_lib" -jar DynamoDBLocal.jar -sharedDb