import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { Document } from "./util.ts";

import { ClientConfig, DynamoDBClient, createClient } from "./mod.ts";

const ENV: Document = Deno.env();

const CONF: ClientConfig = {
  accessKeyId: ENV.ACCESS_KEY_ID,
  secretAccessKey: ENV.SECRET_ACCESS_KEY,
  region: "local"
};

test({
  name: "js <-> query schema translation enabled by default",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_b")) {
      await ddbc.createTable({
       TableName: "users_b",
       KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
       AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
       ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
     });
    }

    const friends: string[] = ["djb", "devil", "donkey kong"];

    response = await ddbc.putItem({
      TableName: "users_b",
      Item: { id: "abc", friends }
    });

    response = await ddbc.getItem({
      TableName: "users_b",
      Key: { id: "abc" }
    });

    assertEquals(response.Item.friends, friends);

    response = await ddbc.deleteTable({
      TableName: "users_b"
    });

    assertEquals(response.TableDescription.TableName, "users_b");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_b"));
  }
});

test({
  name: "raw queries",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_a")) {
      await ddbc.createTable(
        {
          TableName: "users_a",
          KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
        },
        { translateJSON: false }
      );
    }

    response = await ddbc.putItem(
      {
        TableName: "users_a",
        Item: { id: { S: "abc" }, role: { S: "admin" } }
      },
      { translateJSON: false }
    );

    assertEquals(response, {});

    response = await ddbc.getItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(response.Item.role.S, "admin");

    response = await ddbc.deleteItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(response, {});

    response = await ddbc.deleteTable(
      {
        TableName: "users_a"
      },
      { translateJSON: false }
    );

    assertEquals(response.TableDescription.TableName, "users_a");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_a"));
  }
});

test({
  name: "batch write items",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_c")) {
      await ddbc.createTable({
        TableName: "users_c",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
      });
    }

    const N: number = 25;

    const params: Document = {
      RequestItems: { users_c: new Array(N) }
    };

    for (let i: number = 0; i < N; ++i) {
      params.RequestItems.users_c[i] = {
        PutRequest: {
          Item: {
            id: String(i)
          }
        }
      };
    }

    response = await ddbc.batchWriteItem(params);

    assertEquals(Object.keys(response.UnprocessedItems).length, 0);

    response = await ddbc.scan({
      TableName: "users_c",
      Select: "COUNT"
    });

    assertEquals(response.Count, N);

    response = await ddbc.deleteTable({
      TableName: "users_c"
    });

    assertEquals(response.TableDescription.TableName, "users_c");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_c"));
  }
});

test({
  name: "storing a binary value",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_d")) {
      await ddbc.createTable({
        TableName: "users_d",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const buf: Uint8Array = new TextEncoder().encode("deadbeefdeadbeef");

    response = await ddbc.putItem({
      TableName: "users_d",
      Item: { id: "abc", buf }
    });

    assertEquals(response, {});

    response = await ddbc.getItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(response.Item.buf, buf);

    response = await ddbc.deleteItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(response, {});

    response = await ddbc.deleteTable({
      TableName: "users_d"
    });

    assertEquals(response.TableDescription.TableName, "users_d");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_d"));
  }
});

test({
  name: "ops that receive paged responses return an async iterator by default",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_e")) {
      await ddbc.createTable({
        TableName: "users_e",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

      const n: number = 25;
   const N:number = 20 * n

    function batch(_: null, i: number): Promise<Document> {
      const trash: Uint8Array = new Uint8Array(4096)

      const params: Document = {
        RequestItems: { users_e: new Array(n) }
      };

      for (let j: number = 0; j < n; ++j) {
        params.RequestItems.users_e[j] = {
          PutRequest: {
            Item: {
              id: `batch${i} item${j}`,
              trash
            }
          }
        };
      }

      return ddbc.batchWriteItem(params);
    }

    // 20 * n items each gt 4096 bytes
    const batches: Promise<Document>[] = new Array(20).fill(null).map(batch);

    const responses: Document[] = await Promise.all(batches);

    const unprocessed: number = responses.reduce(
      (acc: number, response: Document): number =>
        acc + Object.keys(response.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

     const ait: any= await  ddbc.scan({ TableName: "users_e" })

    let pages: number = 0
    let items: number = 0

    for await (const page of ait) {
      ++pages

      items += page.Count

      assert(Array.isArray(page.Items))
      assert(page.Items.length > 0)
    }

    assertEquals(pages, 2)

    assertEquals(items, N)

    response = await ddbc.deleteTable({
      TableName: "users_e"
    });

    assertEquals(response.TableDescription.TableName, "users_e");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_e"));
  }
});

test({
  name: "handling pagination manually",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let response: Document = await ddbc.listTables();

    if (!response.TableNames.includes("users_f")) {
      await ddbc.createTable({
        TableName: "users_f",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

      const n: number = 25;

    function batch(_: null, i: number): Promise<Document> {
      const trash: Uint8Array = new Uint8Array(4096)

      const params: Document = {
        RequestItems: { users_f: new Array(n) }
      };

      for (let j: number = 0; j < n; ++j) {
        params.RequestItems.users_f[j] = {
          PutRequest: {
            Item: {
              id: `batch${i} item${j}`,
              trash
            }
          }
        };
      }

      return ddbc.batchWriteItem(params);
    }

    // 20 * n items each gt 4096 bytes
    const batches: Promise<Document>[] = new Array(20).fill(null).map(batch);

    const responses: Document[] = await Promise.all(batches);

    const unprocessed: number = responses.reduce(
      (acc: number, response: Document): number =>
        acc + Object.keys(response.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

     // only fetching 1 document - not async iterating
     response= await  ddbc.scan({ TableName: "users_f" }, { iteratePages: false})

     assert(Array.isArray(response.Items))
     assert(response.Items.length > 0)
     assert(!!response.LastEvaluatedKey)

    response = await ddbc.deleteTable({
      TableName: "users_f"
    });

    assertEquals(response.TableDescription.TableName, "users_f");

    response = await ddbc.listTables();

    assert(!response.TableNames.includes("users_f"));
  }
});

runIfMain(import.meta);
