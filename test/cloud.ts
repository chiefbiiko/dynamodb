import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@v0.34.0/testing/asserts.ts";

import {
  ClientConfig,
  Credentials,
  DynamoDBClient,
  createClient
} from "../mod.ts";

import { Doc } from "../util.ts";

/**
 * This test suite requires an existing DynamoDB table as well as the
 * corresponding IAM access permissions. Pass a TABLE_NAME env var.
 */
const TABLE_NAME: string = Deno.env().TABLE_NAME;

const dyno: DynamoDBClient = createClient();

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
    assertThrowsAsync(async (): Promise<void> => {
      await dyno.scan({ TableName: "notatable" });
    }, Error);
  }
});

Deno.test({
  name: "TODO: having temporary credentials refreshed",
  async fn(): Promise<void> {
    // 2 have temp credentials refreshed pass a (n async) credentials func
    // this will refresh creds after recv a 403 by retrying once
    const conf: ClientConfig = {
      async credentials(): Promise<Credentials> {
        // call STS AssumeRole GetSessionToken or similar...
        return {
          accessKeyId: "freshAccessKeyId",
          secretAccessKey: "freshAccessKey",
          sessionToken: "freshSessionToken"
        };
      }
    };

    const dyno: DynamoDBClient = createClient();

    await dyno.listTables();
  }
});

Deno.runTests({ skip: /TODO/ });