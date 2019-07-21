import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import {
  ClientConfig,
  Document,
  DynamoDBClient,
  createClient
} from "./create_client.ts";

const ENV: Document = Deno.env();

const CONF: ClientConfig = {
  accessKeyId: ENV.ACCESS_KEY_ID,
  secretAccessKey: ENV.SECRET_ACCESS_KEY,
  region: "local"
};

test({
  name: "table dance",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    const createTableQuery: Document = {
      TableName: "users",
      KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
      AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    };

    let response: Document = await ddbc.createTable(createTableQuery);

    const putItemQuery: Document = {
      TableName: "users",
      Item: {
        uuid: "abc",
        role: "admin"
      }
    };

    response = await ddbc.putItem(putItemQuery);

    assertEquals(response, {});

    const getItemQuery: Document = {
      TableName: "users",
      Key: {
        uuid: { S: "abc" }
      }
    };

    response = await ddbc.getItem(getItemQuery);

    assertEquals(response.Item.role.S, "admin");
  }
});

runIfMain(import.meta);
