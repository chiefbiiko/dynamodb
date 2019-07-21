import { ClientConfig,Document, DynamoDBClient, createClient} from "./create_client.ts"
import { test, runIfMain} from "https://deno.land/std/testing/mod.ts"
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts"

const ENV:Document= Deno.env();

const conf: ClientConfig = { accessKeyId: ENV.ACCESS_KEY_ID, secretAccessKey: ENV.SECRET_ACCESS_KEY,
region: "local"
}

test({
  name: "table dance",
  async fn(): Promise<void> {
    const ddbc: DynamoDBClient = createClient(conf)
    
    const createTableQuery: Document = { KeySchema: [ { KeyType: 'HASH', AttributeName: 'Id' } ],
  TableName: 'TestTable',
  AttributeDefinitions: [ { AttributeName: 'Id', AttributeType: 'S' } ],
  ProvisionedThroughput: { WriteCapacityUnits: 5, ReadCapacityUnits: 5 } };
    
    let response: Document = await ddbc.createTable(createTableQuery)
    
    // assertEquals(response, {})
    
    const putItemQuery:Document = {
      TableName: "TestTable",
      Item: {
        testKey: "testValue"
      }
    }
    
        response = await ddbc.putItem(putItemQuery)
        
            // assertEquals(response, {})
            
            const getItemQuery:Document = {
              TableName: "TestTable",
              Key: {
                testKey: {
                  S: "testValue"
                }
              },
              "ReturnConsumedCapacity": "TOTAL"
            }
            
                response = await ddbc.getItem(getItemQuery)
                console.error(">>>>>>>>>> response", JSON.stringify(response))
                      assertEquals(response.Item.testKey.S, "testValue")
  }
})

runIfMain(import.meta);