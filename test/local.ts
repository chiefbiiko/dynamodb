import {
  assert,
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@v0.34.0/testing/asserts.ts";

import { ClientConfig, DynamoDBClient, createClient } from "../mod.ts";

import { Doc } from "../util.ts";

const TABLE_NAME: string = "testing_table";

const conf: ClientConfig = {
  credentials: {
    accessKeyId: "DynamoDBLocal",
    secretAccessKey: "DoesNotDoAnyAuth",
    sessionToken: "preferTemporaryCredentials"
  },
  region: "local",
  port: 8000 // DynamoDB Local's default port
};

const dyno: DynamoDBClient = createClient(conf);

await dyno.createTable({
  TableName: TABLE_NAME,
  KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
});

Deno.test({
  name: "schema translation enabled by default",
  async fn(): Promise<void> {
    const id: string = "abc";

    let result: Doc = await dyno.listTables();

    const friends: string[] = ["djb", "devil", "donkey kong"];

    result = await dyno.putItem({
      TableName: TABLE_NAME,
      Item: { id, friends }
    });

    result = await dyno.getItem({
      TableName: TABLE_NAME,
      Key: { id }
    });

    assertEquals(result.Item.friends, friends);
  }
});

Deno.test({
  name: "opt-in raw queries",
  async fn(): Promise<void> {
    const id: string = "def";

    let result: Doc = await dyno.putItem(
      {
        TableName: TABLE_NAME,
        Item: { id: { S: id }, role: { S: "admin" } }
      },
      { translateJSON: false }
    );

    assertEquals(result, {});

    result = await dyno.getItem(
      {
        TableName: TABLE_NAME,
        Key: { id: { S: id } }
      },
      { translateJSON: false }
    );

    assertEquals(result.Item.role.S, "admin");
  }
});

Deno.test({
  name: "batch write items",
  async fn(): Promise<void> {
    const N: number = 25;

    const params: Doc = {
      RequestItems: { [TABLE_NAME]: new Array(N) }
    };

    for (let i: number = 0; i < N; ++i) {
      params.RequestItems[TABLE_NAME][i] = {
        PutRequest: {
          Item: {
            id: String(i)
          }
        }
      };
    }

    const result: Doc = await dyno.batchWriteItem(params);

    assertEquals(Object.keys(result.UnprocessedItems).length, 0);
  }
});

Deno.test({
  name: "storing a binary value",
  async fn(): Promise<void> {
    const id: string = "ghi";

    const buf: Uint8Array = new TextEncoder().encode("deadbeefdeadbeef");

    let result: Doc = await dyno.putItem({
      TableName: TABLE_NAME,
      Item: { id, buf }
    });

    assertEquals(result, {});

    result = await dyno.getItem({
      TableName: TABLE_NAME,
      Key: { id }
    });

    assertEquals(result.Item.buf, buf);
  }
});

Deno.test({
  name: "deleting an item",
  async fn(): Promise<void> {
    const id: string = "jkl";

    let result: Doc = await dyno.putItem({
      TableName: TABLE_NAME,
      Item: { id, fraud: "money" }
    });

    assertEquals(result, {});

    result = await dyno.deleteItem({
      TableName: TABLE_NAME,
      Key: { id }
    });

    assertEquals(result, {});
  }
});

Deno.test({
  name: "missing table throws a readable error",
  async fn(): Promise<void> {
    assertThrowsAsync(
      async (): Promise<void> => {
        await dyno.scan({ TableName: "notatable" });
      },
      Error,
      "Cannot do operations on a non-existent table"
    );
  }
});

Deno.test({
  name: "ops that receive paged results return an async iterator by default",
  async fn(): Promise<void> {
    const n: number = 25;
    const N: number = 20 * n;

    function batch(_: null, i: number): Promise<Doc> {
      const trash: Uint8Array = new Uint8Array(4096);

      const params: Doc = {
        RequestItems: { [TABLE_NAME]: new Array(n) }
      };

      for (let j: number = 0; j < n; ++j) {
        params.RequestItems[TABLE_NAME][j] = {
          PutRequest: {
            Item: {
              id: `batch${i} item${j}`,
              trash
            }
          }
        };
      }

      return dyno.batchWriteItem(params);
    }

    // 20 * 25 items each gt 4096 bytes
    const batches: Promise<Doc>[] = new Array(20).fill(null).map(batch);

    const results: Doc[] = await Promise.all(batches);

    const unprocessed: number = results.reduce(
      (acc: number, result: Doc): number =>
        acc + Object.keys(result.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

    const ait: any = await dyno.scan({ TableName: TABLE_NAME });

    let pages: number = 0;
    let items: number = 0;

    for await (const page of ait) {
      assert(Array.isArray(page.Items));
      assert(page.Items.length > 0);

      ++pages;
      items += page.Count;
    }

    assert(pages >= 2);

    assert(items > N);
  }
});

Deno.test({
  name: "handling pagination manually",
  async fn(): Promise<void> {
    // only fetching 1 page - not async iterating
    const result: Doc = await dyno.scan(
      { TableName: TABLE_NAME },
      { iteratePages: false }
    );

    assert(Array.isArray(result.Items));
    assert(result.Items.length > 0);
    assert(!!result.LastEvaluatedKey);
  }
});

Deno.runTests();