import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { HeadersConfig, createHeaders } from "./create_headers.ts";
import { Translator } from "./translator.ts";
import { Document } from "./types.ts";
import { API } from "./model/mod.ts"

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  [key: string]: (query: Document, options?: Document) => Promise<Document>;
}

/** Client configuration. */
export interface ClientConfig {
  accessKeyId: string; // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string; // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: string; // us-west-2
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 8000
}

const OPS: Set<string> = new Set([
  "BatchGetItem",
  "BatchWriteItem",
  "CreateBackup",
  "CreateGlobalTable",
  "CreateTable",
  "DeleteBackup",
  "DeleteItem",
  "DeleteTable",
  "DescribeBackup",
  "DescribeContinuousBackups",
  "DescribeEndpoints",
  "DescribeGlobalTable",
  "DescribeGlobalTableSettings",
  "DescribeLimits",
  "DescribeTable",
  "DescribeTimeToLive",
  "GetItem",
  "ListBackups",
  "ListGlobalTables",
  "ListTables",
  "ListTagsOfResource",
  "PutItem",
  "Query",
  "RestoreTableFromBackup",
  "RestoreTableToPointInTime",
  "Scan",
  "TagResource",
  "TransactGetItems",
  "TransactWriteItems",
  "UntagResource",
  "UpdateContinuousBackups",
  "UpdateGlobalTable",
  "UpdateGlobalTableSettings",
  "UpdateItem",
  "UpdateTable",
  "UpdateTimeToLive"
]);

/** Base op. */
async function baseOp(
  conf: Document,
  op: string,
  query: Document,
  options: Document = {}
): Promise<Document> {
  let translator: any
  
  if (!options.raw) {
    translator = new Translator(options)
    console.error(">>>>>>>>>>> op", op)
    console.error(">>>>>>>>>>> API.operations", API.operations)
    const inputShape: any = API.operations[op].input
    query = translator.translateInput(query, inputShape)
  }

  const payload: Uint8Array = encode(JSON.stringify(query), "utf8");
  const headers: Headers = createHeaders({
    ...conf,
    op,
    method: conf.method,
    payload
  } as HeadersConfig);

  const rawResult: Document = await fetch(conf.endpoint, {
    method: conf.method,
    headers,
    body: payload
  }).then(
    (response: Response): Document => {
      // console.error(">>>>>>> response.status", response.status)
      // console.error(">>>>>>>>> response.statusText", response.statusText)
      // if (!response.ok) {
      //   throw new Error("http query request failed")
      // }

      return response.json();
    }
  );

  if (options.raw) {
    return rawResult
  }

const outputShape: any = API.operations[op].output

  return translator.translateOutput(rawResult, outputShape)
}

/** Creates a DynamoDB client. */
export function createClient(conf: ClientConfig): DynamoDBClient {
  if (!conf.accessKeyId || !conf.secretAccessKey || !conf.region) {
    throw new TypeError(
      "client config must include accessKeyId, secretAccessKey and region"
    );
  }

  const method: string = "POST";

  const host: string =
    conf.region === "local"
      ? "localhost"
      : `dynamodb.${conf.region}.amazonaws.com`;

  const endpoint: string = `http${
    conf.region === "local" ? "" : "s"
  }://${host}:${conf.port || 8000}/`;

  const _conf: Document = { ...conf, host, method, endpoint };

  const ddbc: DynamoDBClient = {};

  for (const op of OPS) {
    const snakeCaseOp: string = `${op[0].toLowerCase()}${op.slice(1)}`;
    ddbc[snakeCaseOp] = baseOp.bind(null, _conf, op);
  }

  return ddbc;
}
