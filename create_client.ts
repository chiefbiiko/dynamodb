import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { HeadersConfig, createHeaders } from "./create_headers.ts";
import { Translator } from "./translator.ts";
import { Document } from "./util.ts";
import { API } from "./api/mod.ts"

const ATTR_VALUE: string = API.operations.PutItem.input.members.Item.value.shape;

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  [key: string]: (query?: Document, options?: Document) => Promise<Document>;
}

/** Client configuration. */
export interface ClientConfig {
  accessKeyId: string; // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string; // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: string; // us-west-2
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 8000
}

export const OPS: Set<string> = new Set([
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

/** Base fetch. */
async function baseFetch(conf: Document, op: string, query: Document): Promise<Document> {
  // console.error(">>>>>>>>>>>>> prep query", JSON.stringify(query), "\n")

    const payload: Uint8Array = encode(JSON.stringify(query), "utf8");
    const headers: Headers = createHeaders({
      ...conf,
      op,
      method: conf.method,
      payload
    } as HeadersConfig);

    return fetch(conf.endpoint, {
      method: conf.method,
      headers,
      body: payload
    }).then(
      (response: Response): Document => {
        // console.error(">>>>>>> op response.status",op,  response.status," response.statusText", response.statusText)
        // console.error(">>>>>>> response.statusText", response.statusText)
        if (!response.ok) {
          // console.error("RESPONSE >>>>>>>>>>>>>>>>>>>>>>>>>>>> ", JSON.stringify(await response.json()))
          throw new Error(`http query request failed: ${response.status} ${response.statusText}`)
        }

        return response.json();
      }
    );
}

/** Base op. */
async function baseOp(
  conf: Document,
  op: string,
  query: Document = {},
  options: Document = {}
): Promise<Document> {
  let translator: any
  //     console.error(">>>>>>>>>>> op", op)
  // console.error("\n>>>>>>>>>>>>> user query", JSON.stringify(query))
  if (!options.raw) {
    /*
    options.attrValue =
      self.service.api.operations.putItem.input.members.Item.value.shape;
    */
    translator = new Translator({...options, attrValue: ATTR_VALUE})
    // translator = new Translator(options)

        // console.error(">>>>>>>>>>> API.operations", API.operations)
    // console.error(">>>>>>>>>>> API.operations[op].input", API.operations[op].input)
    const inputShape: any = API.operations[op].input
    // TODO
    // var preserve = {}
    // const preserve: Document = //{}
    // for each inputShape.members prop if value == empty object then preserve[key] = value
    // const toTranslate: Document =  Object.entries(inputShape.members).reduce((acc: Document, [key, value]: [string, string]): Document => {
    //   console.error(">>>>>>>>> CHECK", key)
    //   if (key === "Key" || key === "Item") {
    //     console.log(">>>>>>>>>>>>> translateE KEY", key)
    //     acc[key] = query[key]
    //   }
    //
    //   return acc
    // }, {})
    // console.error(">>>>>>>>>>>>>> TOTRANSLATE", JSON.stringify(toTranslate))
    // query = { ...query, ...translator.translateInput(toTranslate, inputShape).M }
    query = translator.translateInput(query, inputShape)
  } else {
    query = { ...query}
  }

// console.error(">>>>>>>>>>>>> prep query", JSON.stringify(query), "\n")
//
//   const payload: Uint8Array = encode(JSON.stringify(query), "utf8");
//   const headers: Headers = createHeaders({
//     ...conf,
//     op,
//     method: conf.method,
//     payload
//   } as HeadersConfig);
//
//   const rawResult: Document = await fetch(conf.endpoint, {
//     method: conf.method,
//     headers,
//     body: payload
//   }).then(
//     (response: Response): Document => {
//       console.error(">>>>>>> response.status", response.status," response.statusText", response.statusText)
//       // console.error(">>>>>>> response.statusText", response.statusText)
//       if (!response.ok) {
//         throw new Error(`http query request failed: ${response.status} ${response.statusText}`)
//       }
//
//       return response.json();
//     }
//   );

   let rawResult: Document = await baseFetch(conf, op, query)
// console.error(">>>>>>>>>>> rawResult.LastEvaluatedKey",rawResult.LastEvaluatedKey)
   if (rawResult.LastEvaluatedKey && options.iteratePages) {
     // TODO: return an async iterator over the pages -- outsource
     // let sawEOF: boolean = false
     let lastEvaluatedKey: any = rawResult.LastEvaluatedKey
     let first: boolean = true

     return {
       [Symbol.asyncIterator](): AsyncIterableIterator<Document> {
         return this;
       },
       async next(): Promise<IteratorResult<Document>> {
         // console.error(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> NEXT")
         // if (sawEof) {
         //   return { value: new Uint8Array(), done: true };
         // }
         //
         // const result = await r.read(b);
         // if (result === EOF) {
         //   sawEof = true;
         //   return { value: new Uint8Array(), done: true };
         // }
         //
         // return {
         //   value: b.subarray(0, result),
         //   done: false
         // };
         if (!lastEvaluatedKey) {
           return {value:{},done:true}
         }

        if (first) {
          first = false

          lastEvaluatedKey = rawResult.LastEvaluatedKey

          if (options.raw) {
            return {
              value: rawResult,
              done: false
            }
          } else {
            const outputShape: any = API.operations[op].output
            var result = translator.translateOutput(rawResult, outputShape)
            // console.error(">>>>>>>>>>> result", result)

            return {
              value: result,
              done: false
            }
          }
        } else {
              query.ExclusiveStartKey = lastEvaluatedKey
        }

         rawResult =  await baseFetch(conf, op, query)

         lastEvaluatedKey = rawResult.LastEvaluatedKey

         if (options.raw) {
           return {value :rawResult, done: false}//!lastEvaluatedKey}
         }

         const outputShape: any = API.operations[op].output
         var result = translator.translateOutput(rawResult, outputShape)
         // console.error(">>>>>>>>>>> result", result)
           return {value :result, done: false}// !lastEvaluatedKey} // result
       }
     };
   } else if (rawResult.LastEvaluatedKey && !options.iteratePages) {
     throw new Error(`response is paged but options.iteratePages is false`)
   }

// console.error(">>>>>>>>> rawResult", JSON.stringify(rawResult))
  if (options.raw) {
    return rawResult
  }

const outputShape: any = API.operations[op].output
var result = translator.translateOutput(rawResult, outputShape)
// console.error(">>>>>>>>>>> result", result)
  return result
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
    const camelCaseOp: string = `${op[0].toLowerCase()}${op.slice(1)}`;
    ddbc[camelCaseOp] = baseOp.bind(null, _conf, op);
  }

  return ddbc;
}
