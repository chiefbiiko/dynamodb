import { test, runIfMain } from "https://deno.land/std@v0.26.0/testing/mod.ts";
import {
  assert,
  assertEquals,
  assertThrowsAsync
} from "https://deno.land/std@v0.26.0/testing/asserts.ts";
import {
  ClientConfig,
  Credentials,
  DynamoDBClient,
  createClient
} from "./mod.ts";
import { encode } from "./deps.ts";
import { awsSignatureV4, kdf } from "./client/mod.ts";
import { Doc } from "./util.ts";

const ENV: Doc = Deno.env();

const CONF: ClientConfig = {
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY
  },
  region: "local",
  port: 8000 // DynamoDB Local's default port
};

test({
  name: "aws signature v4 flow",
  fn(): void {
    const expectedSignature: string =
      "31fac5ed29db737fbcafac527470ca6d9283283197c5e6e94ea40ddcec14a9c1";

    const key: Uint8Array = kdf(
      "secret",
      "20310430",
      "region",
      "dynamodb",
      "utf8"
    ) as Uint8Array;

    const msg: Uint8Array = encode(
      "AWS4-HMAC-SHA256\n20310430T201613Z\n20310430/region/dynamodb/aws4_request\n4be20e7bf75dc6c7e93873b5f49096771729b8a28f0c62010db431fea79220ef",
      "utf8"
    );

    const actualSignature: string = awsSignatureV4(key, msg, "hex") as string;

    assertEquals(actualSignature, expectedSignature);
  }
});

test({
  name: "schema translation enabled by default",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_b")) {
      await dyno.createTable({
        TableName: "users_b",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const friends: string[] = ["djb", "devil", "donkey kong"];

    result = await dyno.putItem({
      TableName: "users_b",
      Item: { id: "abc", friends }
    });

    result = await dyno.getItem({
      TableName: "users_b",
      Key: { id: "abc" }
    });

    assertEquals(result.Item.friends, friends);

    result = await dyno.deleteTable({
      TableName: "users_b"
    });

    assertEquals(result.TableDescription.TableName, "users_b");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_b"));
  }
});

test({
  name: "opt-in raw queries",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_a")) {
      await dyno.createTable(
        {
          TableName: "users_a",
          KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
        },
        { translateJSON: false }
      );
    }

    result = await dyno.putItem(
      {
        TableName: "users_a",
        Item: { id: { S: "abc" }, role: { S: "admin" } }
      },
      { translateJSON: false }
    );

    assertEquals(result, {});

    result = await dyno.getItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(result.Item.role.S, "admin");

    result = await dyno.deleteItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(result, {});

    result = await dyno.deleteTable(
      {
        TableName: "users_a"
      },
      { translateJSON: false }
    );

    assertEquals(result.TableDescription.TableName, "users_a");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_a"));
  }
});

test({
  name: "batch write items",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_c")) {
      await dyno.createTable({
        TableName: "users_c",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
      });
    }

    const N: number = 25;

    const params: Doc = {
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

    result = await dyno.batchWriteItem(params);

    assertEquals(Object.keys(result.UnprocessedItems).length, 0);

    result = await dyno.scan({
      TableName: "users_c",
      Select: "COUNT"
    });

    assertEquals(result.Count, N);

    result = await dyno.deleteTable({
      TableName: "users_c"
    });

    assertEquals(result.TableDescription.TableName, "users_c");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_c"));
  }
});

test({
  name: "storing a binary value",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_d")) {
      await dyno.createTable({
        TableName: "users_d",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const buf: Uint8Array = new TextEncoder().encode("deadbeefdeadbeef");

    result = await dyno.putItem({
      TableName: "users_d",
      Item: { id: "abc", buf }
    });

    assertEquals(result, {});

    result = await dyno.getItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(result.Item.buf, buf);

    result = await dyno.deleteItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(result, {});

    result = await dyno.deleteTable({
      TableName: "users_d"
    });

    assertEquals(result.TableDescription.TableName, "users_d");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_d"));
  }
});

test({
  name: "ops that receive paged results return an async iterator by default",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_e")) {
      await dyno.createTable({
        TableName: "users_e",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const n: number = 25;
    const N: number = 20 * n;

    function batch(_: null, i: number): Promise<Doc> {
      const trash: Uint8Array = new Uint8Array(4096);

      const params: Doc = {
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

      return dyno.batchWriteItem(params);
    }

    // 20 * n items each gt 4096 bytes
    const batches: Promise<Doc>[] = new Array(20).fill(null).map(batch);

    const results: Doc[] = await Promise.all(batches);

    const unprocessed: number = results.reduce(
      (acc: number, result: Doc): number =>
        acc + Object.keys(result.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

    const ait: any = await dyno.scan({ TableName: "users_e" });

    let pages: number = 0;
    let items: number = 0;

    for await (const page of ait) {
      assert(Array.isArray(page.Items));
      assert(page.Items.length > 0);

      ++pages;
      items += page.Count;
    }

    assertEquals(pages, 2);

    assertEquals(items, N);

    result = await dyno.deleteTable({
      TableName: "users_e"
    });

    assertEquals(result.TableDescription.TableName, "users_e");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_e"));
  }
});

test({
  name: "handling pagination manually",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (!result.TableNames.includes("users_f")) {
      await dyno.createTable({
        TableName: "users_f",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const n: number = 25;

    function batch(_: null, i: number): Promise<Doc> {
      const trash: Uint8Array = new Uint8Array(4096);

      const params: Doc = {
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

      return dyno.batchWriteItem(params);
    }

    // 20 * n items each gt 4096 bytes
    const batches: Promise<Doc>[] = new Array(20).fill(null).map(batch);

    const results: Doc[] = await Promise.all(batches);

    const unprocessed: number = results.reduce(
      (acc: number, result: Doc): number =>
        acc + Object.keys(result.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

    // only fetching 1 page - not async iterating
    result = await dyno.scan({ TableName: "users_f" }, { iteratePages: false });

    assert(Array.isArray(result.Items));
    assert(result.Items.length > 0);
    assert(!!result.LastEvaluatedKey);

    result = await dyno.deleteTable({
      TableName: "users_f"
    });

    assertEquals(result.TableDescription.TableName, "users_f");

    result = await dyno.listTables();

    assert(!result.TableNames.includes("users_f"));
  }
});

test({
  name: "missing table throws a readable error",
  async fn(): Promise<void> {
    const dyno: DynamoDBClient = createClient(CONF);

    let result: Doc = await dyno.listTables();

    if (result.TableNames.includes("nonexistent_table")) {
      await dyno.deleteTable({
        TableName: "nonexistent_table"
      });
    }

    async function fn(): Promise<void> {
      await dyno.scan({ TableName: "nonexistent_table" });
    }

    assertThrowsAsync(
      fn,
      Error,
      "Cannot do operations on a non-existent table"
    );
  }
});

test({
  name: "passing temporary credentials including a session token",
  async fn(): Promise<void> {
    // currently there's no way to test the session token is appended to the
    // header but we include it in the ClientConfig
    const conf: ClientConfig = {
      credentials: {
        accessKeyId: "freshAccessKeyId",
        secretAccessKey: "freshAccessKey",
        sessionToken: "freshSessionToken"
      },
      region: "local",
      port: 8000 // DynamoDB Local's default port
    };

    const dyno: DynamoDBClient = createClient(conf);

    await dyno.listTables();
  }
});

test({
  name: "having temporary credentials refreshed",
  async fn(): Promise<void> {
    // 2 have temp credentials refreshed pass a (n async) credentials func
    // this will refresh creds after recv a 403 and then retry once
    const conf: ClientConfig = {
      async credentials(): Credentials {
        // call STS AssumeRole GetSessionToken or similar...
        return {
          accessKeyId: "freshAccessKeyId",
          secretAccessKey: "freshAccessKey",
          sessionToken: "freshSessionToken"
        };
      },
      region: "local",
      port: 8000 // DynamoDB Local's default port
    };

    const dyno: DynamoDBClient = createClient(conf);

    await dyno.listTables();
  }
});

runIfMain(import.meta);
