import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { createHeaders} from "./create_headers.ts"

/** Generic document. */
export interface Document {
  [key:string]: any;
}

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  [key:string]: (doc: Document)=> Promise<Document>
}

/** Client configuration- */
export interface ClientConfig {
  accessKeyId: string // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: string // us-west-2
  canonicalUri?: string // fx /path/to/somewhere
}

const OPS: Set<string> = new Set(["BatchGetItem",
"BatchWriteItem",
"CreateBackup",
"CreateGlobalTable", "CreateTable", "DeleteBackup", "DeleteItem", "DeleteTable",
"DescribeBackup", "DescribeContinuousBackups", "DescribeEndpoints", "DescribeGlobalTable",
"DescribeGlobalTableSettings", "DescribeLimits", "DescribeTable", "DescribeTimeToLive",
"GetItem", "ListBackups", "ListGlobalTables", "ListTables", "ListTagsOfResource", "PutItem",
"Query", "RestoreTableFromBackup", "RestoreTableToPointInTime", "Scan", "TagResource",
"TransactGetItems", "TransactWriteItems", "UntagResource", "UpdateContinuousBackups",
"UpdateGlobalTable", "UpdateGlobalTableSettings", "UpdateItem", "UpdateTable", "UpdateTimeToLive"
])

/** Base op. */
async function baseOp (conf: Document, op: string, doc: Document): Promise< Document> {
  const method: string = "POST"
  
  const payload: Uint8Array = encode(JSON.stringify(doc), "utf8")
  const headers: Headers = createHeaders({ ...conf, op, method,  payload })

const response: Response =  await fetch(conf.endpoint, {method,  headers,body: payload})

return response.json()
}

/** Creates a DynamoDB client. */
export function createClient(conf: ClientConfig): DynamoDBClient {
     const host: string = conf.region === "local" ? "localhost" : `dynamodb.${conf.region}.amazonaws.com`
     const endpoint: string = `http${conf.region === "local" ? "" : "s"}://${host}`
     const _conf: Document = { ...conf, host, endpoint}
     
  const ddbc: DynamoDBClient = {};
  
  for (const op of OPS) {
    ddbc[op] = baseOp.bind(null,_conf, op)
  }
  
  return ddbc;
}