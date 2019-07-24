import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { Document } from "./util.ts";

import { ClientConfig, DynamoDBClient, createClient } from "./create_client.ts";

const ENV: Document = Deno.env();

const CONF: ClientConfig = {
  accessKeyId: ENV.ACCESS_KEY_ID,
  secretAccessKey: ENV.SECRET_ACCESS_KEY,
  region: "local"
};

test({
  name: "raw queries",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.createTable({
      TableName: "users_a",
      KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
      AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }, { raw:true });

    response = await ddbc.putItem({
      TableName: "users_a",
      Item: { uuid: { S: "abc" }, role: { S: "admin" } }
    }, { raw: true });

    assertEquals(response, {});

    response = await ddbc.getItem({
      TableName: "users_a",
      Key: { uuid: { S: "abc" } }
    }, { raw: true });

    assertEquals(response.Item.role.S, "admin");

    response = await ddbc.deleteItem({
      TableName: "users_a",
      Key: { uuid: { S: "abc" } }
    }, { raw: true });

    assertEquals(response, {});

    response = await ddbc.deleteTable({
      TableName: "users_a"
    }, { raw: true });

    // assertEquals(response, {});

    response = await ddbc.listTables()

    assert(!response.TableNames.includes("users_a"))
  }
});

test({
  name: "js <-> query schema translation enabled by default",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.createTable(
      {
        TableName: "users_b",
        KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
        AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      }
    );

    const friends: string[] = ["djb", "devil", "donkey kong"];

    response = await ddbc.putItem({
      TableName: "users_b",
      Item: { uuid: "abc", friends }
    });

    response = await ddbc.getItem({
      TableName: "users_b",
      Key: { uuid: "abc" }
    });

    assertEquals(response.Item.friends, friends);

    response = await ddbc.deleteTable({
      TableName: "users_b"
    });

    // assertEquals(response, {});

    response = await ddbc.listTables()

    assert(!response.TableNames.includes("users_b"))
  }
});

test({
  name: "batch write items",
async  fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.createTable(
      {
        TableName: "users_c",
        KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
        AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
      }
    );

const N: number = 25

 const params: Document = {
   RequestItems: { users_c: new Array(N) }
 }

   for (let i :number = 0; i < N; ++i) {
     params.RequestItems.users_c[i] =               {
                  PutRequest: {
                    Item: {
                      uuid: String(i)
                    }
                  }
                }
   }

    response  = await ddbc.batchWriteItem(params)

    assertEquals(Object.keys(response.UnprocessedItems).length, 0)

    response  = await ddbc.scan({
      TableName: "users_c",
      Select: "COUNT"
    })

    assertEquals(response.Count, N)

  }
})

test({
  name: "storing a binary value",
  async fn():Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.createTable({
      TableName: "users_d",
      KeySchema: [{ KeyType: "HASH", AttributeName: "uuid" }],
      AttributeDefinitions: [{ AttributeName: "uuid", AttributeType: "S" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    });

    const buf: Uint8Array = new TextEncoder().encode("deadbeefdeadbeef")

    response = await ddbc.putItem({
      TableName: "users_d",
      Item: { uuid: "abc", buf }
    });

    assertEquals(response, {});

    response = await ddbc.getItem({
      TableName: "users_d",
      Key: { uuid: "abc"}
    });

    assertEquals(response.Item.buf, buf);

    response = await ddbc.deleteItem({
      TableName: "users_d",
      Key: { uuid: "abc"}
    });

    assertEquals(response, {});

    response = await ddbc.deleteTable({
      TableName: "users_d"
    });

    // assertEquals(response, {});

    response = await ddbc.listTables()

    assert(!response.TableNames.includes("users_d"))
  }
})

runIfMain(import.meta);
