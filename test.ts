import { ClientConfig,Document, DynamoDBClient, createClient} from "./create_client.ts"
import { test, runIfMain} from "https://deno.land/std/testing/mod.ts"
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts"

const ENV:Document= Deno.env();

const conf: ClientConfig = { accessKeyId: ENV.ACCESS_KEY_ID, secretAccessKey: ENV.SECRET_ACCESS_KEY,
region: "local"
}

const ddbc: DynamoDBClient = createClient(conf)

test({
  name: "create table",
  async fn(): Promise<void> {
    const query: Document = { KeySchema: [ { KeyType: 'HASH', AttributeName: 'Id' } ],
  TableName: 'TestTable',
  AttributeDefinitions: [ { AttributeName: 'Id', AttributeType: 'S' } ],
  ProvisionedThroughput: { WriteCapacityUnits: 5, ReadCapacityUnits: 5 } };
    
    const response = await ddbc.createTable(query)
    
    assertEquals(response, {})
  }
})

runIfMain(import.meta);