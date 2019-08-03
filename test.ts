import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { encode} from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";

import { Document } from "./util.ts";

import { awsv4Signature } from "./awsv4signature.ts";

import { ClientConfig, DynamoDBClient, createClient } from "./mod.ts";

const ENV: Document = Deno.env();

const CONF: ClientConfig = {
  accessKeyId: ENV.ACCESS_KEY_ID,
  secretAccessKey: ENV.SECRET_ACCESS_KEY,
  region: "local"
};

test({
  name: "awsv4signature",
  fn(): void {
    const ALGORITHM: string = "AWS4-HMAC-SHA256";
    const amzDate: string = "20150830T123600Z";
    const credentialScope: string = "20150830/us-east-1/service/aws4_request";
    const canonicalRequestDigest: string  ="816cd5b414d056048ba4f7c5386d6e0533120fb1fcfa93762cf0fc39e2cf19e0";

    const msg: Uint8Array = encode(
      `${ALGORITHM}\n${amzDate}\n${credentialScope}\n${canonicalRequestDigest}`,
      "utf8"
    );

    const signingKey: Uint8Array = encode("wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY", "utf8");

    const expectedSignature: string = "b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500";

    const actualSignature: string = awsv4Signature(signingKey, msg, "hex") as string;

    assertEquals(actualSignature, expectedSignature);
  }
});

test({
  name: "js <-> query schema translation enabled by default",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_b")) {
      await ddbc.createTable({
       TableName: "users_b",
       KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
       AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
       ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
     });
    }

    const friends: string[] = ["djb", "devil", "donkey kong"];

    result = await ddbc.putItem({
      TableName: "users_b",
      Item: { id: "abc", friends }
    });

    result = await ddbc.getItem({
      TableName: "users_b",
      Key: { id: "abc" }
    });

    assertEquals(result.Item.friends, friends);

    result = await ddbc.deleteTable({
      TableName: "users_b"
    });

    assertEquals(result.TableDescription.TableName, "users_b");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_b"));
  }
});

test({
  name: "raw queries",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_a")) {
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

    result = await ddbc.putItem(
      {
        TableName: "users_a",
        Item: { id: { S: "abc" }, role: { S: "admin" } }
      },
      { translateJSON: false }
    );

    assertEquals(result, {});

    result = await ddbc.getItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(result.Item.role.S, "admin");

    result = await ddbc.deleteItem(
      {
        TableName: "users_a",
        Key: { id: { S: "abc" } }
      },
      { translateJSON: false }
    );

    assertEquals(result, {});

    result = await ddbc.deleteTable(
      {
        TableName: "users_a"
      },
      { translateJSON: false }
    );

    assertEquals(result.TableDescription.TableName, "users_a");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_a"));
  }
});

test({
  name: "batch write items",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_c")) {
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

    result = await ddbc.batchWriteItem(params);

    assertEquals(Object.keys(result.UnprocessedItems).length, 0);

    result = await ddbc.scan({
      TableName: "users_c",
      Select: "COUNT"
    });

    assertEquals(result.Count, N);

    result = await ddbc.deleteTable({
      TableName: "users_c"
    });

    assertEquals(result.TableDescription.TableName, "users_c");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_c"));
  }
});

test({
  name: "storing a binary value",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_d")) {
      await ddbc.createTable({
        TableName: "users_d",
        KeySchema: [{ KeyType: "HASH", AttributeName: "id" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      });
    }

    const buf: Uint8Array = new TextEncoder().encode("deadbeefdeadbeef");

    result = await ddbc.putItem({
      TableName: "users_d",
      Item: { id: "abc", buf }
    });

    assertEquals(result, {});

    result = await ddbc.getItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(result.Item.buf, buf);

    result = await ddbc.deleteItem({
      TableName: "users_d",
      Key: { id: "abc" }
    });

    assertEquals(result, {});

    result = await ddbc.deleteTable({
      TableName: "users_d"
    });

    assertEquals(result.TableDescription.TableName, "users_d");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_d"));
  }
});

test({
  name: "ops that receive paged results return an async iterator by default",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_e")) {
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

    const results: Document[] = await Promise.all(batches);

    const unprocessed: number = results.reduce(
      (acc: number, result: Document): number =>
        acc + Object.keys(result.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

     const ait: any= await  ddbc.scan({ TableName: "users_e" })

    let pages: number = 0
    let items: number = 0

    for await (const page of ait) {
            assert(Array.isArray(page.Items))
            assert(page.Items.length > 0)
            
      ++pages
      items += page.Count
    }

    assertEquals(pages, 2)

    assertEquals(items, N)

    result = await ddbc.deleteTable({
      TableName: "users_e"
    });

    assertEquals(result.TableDescription.TableName, "users_e");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_e"));
  }
});

test({
  name: "handling pagination manually",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(CONF);

    let result: Document = await ddbc.listTables();

    if (!result.TableNames.includes("users_f")) {
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

    const results: Document[] = await Promise.all(batches);

    const unprocessed: number = results.reduce(
      (acc: number, result: Document): number =>
        acc + Object.keys(result.UnprocessedItems).length,
      0
    );

    assertEquals(unprocessed, 0);

     // only fetching 1 page - not async iterating
     result= await  ddbc.scan({ TableName: "users_f" }, { iteratePages: false})

     assert(Array.isArray(result.Items))
     assert(result.Items.length > 0)
     assert(!!result.LastEvaluatedKey)

    result = await ddbc.deleteTable({
      TableName: "users_f"
    });

    assertEquals(result.TableDescription.TableName, "users_f");

    result = await ddbc.listTables();

    assert(!result.TableNames.includes("users_f"));
  }
});

runIfMain(import.meta, { only: /aws/ });
