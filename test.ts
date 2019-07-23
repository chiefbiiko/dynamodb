import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { Document } from "./types.ts";

import { ClientConfig, DynamoDBClient, createClient } from "./create_client.ts";

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

    let response: Document = await ddbc.createTable({
      TableName: "users",
      KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
      AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    });

    response = await ddbc.putItem({
      TableName: "users",
      Item: { uuid: { S: "abc" }, role: { S: "admin" } }
    });

    assertEquals(response, {});

    response = await ddbc.getItem({
      TableName: "users",
      Key: { uuid: { S: "abc" } }
    });

    assertEquals(response.Item.role.S, "admin");

    response = await ddbc.deleteItem({
      TableName: "users",
      Key: { uuid: { S: "abc" } }
    });

    assertEquals(response, {});
  }
});

test({
  name: "convertable",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.createTable(
      {
        TableName: "UsersA",
        KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
        AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      }
    );

    response = await ddbc.putItem({
      TableName: "UsersA",
      Item: { uuid: "abc", friends: ["djb", "devil"] }
    });

    response = await ddbc.getItem({
      TableName: "UsersA",
      Key: { uuid: "abc" }
    });

    // console.error(">>>>>>> response", JSON.stringify(response));

    assertEquals(response.Item.friends, ["djb", "devil"]);
  }
});

runIfMain(import.meta, { only: /convertable/ });
