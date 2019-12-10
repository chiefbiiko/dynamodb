import { encode } from "./deps.ts";
import { API } from "./api/mod.ts";
import { HeadersConfig, Translator, createHeaders, kdf } from "./client/mod.ts";
import { Doc, camelCase, date } from "./util.ts";

/** Convenience export. */
export { Doc } from "./util.ts";

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  describeEndpoints: (options?: Doc) => Promise<Doc>;
  describeLimits: (options?: Doc) => Promise<Doc>;
  listTables: (options?: Doc) => Promise<Doc>;
  scan: (
    params: Doc,
    options?: Doc
  ) => Promise<Doc | AsyncIterableIterator<Doc>>;
  query: (
    params: Doc,
    options?: Doc
  ) => Promise<Doc | AsyncIterableIterator<Doc>>;
  [key: string]: (params: Doc, options?: Doc) => Promise<Doc>;
}

/** Client configuration. */
export interface ClientConfig {
  accessKeyId: string; // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string; // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: string; // us-west-2
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 8000
}

/** Op options. */
export interface OpOptions {
  wrapNumbers?: boolean; // wrap numbers to a special number value type? [false]
  convertEmptyValues?: boolean; // convert empty strings and binaries? [false]
  translateJSON?: boolean; // translate I/O JSON schemas? [true]
  iteratePages?: boolean; // if a result is paged, async-iterate it? [true]
}

/** DynamoDB operations. */
export const OPS: Set<string> = new Set<string>([
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

export const NO_PARAMS_OPS: Set<string> = new Set<string>([
  "DescribeEndpoints",
  "DescribeLimits",
  "ListTables"
]);

/** Service name. */
const SERVICE: string = "dynamodb";

/** Base shape of all DynamoDB query schemas. */
const ATTR_VALUE: string =
  API.operations.PutItem.input.members.Item.value.shape;

/** Cache for credentialScope and expensive signature key. */
function createCache(conf: Doc): Doc {
  return {
    _day: "",
    _credentialScope: "",
    _key: null,
    _maybeRefresh(): void {
      const d: Date = new Date();
      const day: string = d.toISOString().slice(8, 10);

      if (this._day !== day) {
        // the key and credentialScope values are obsolete
        const dateStamp: string = date.format(d, "dateStamp");

        this._key = kdf(
          conf.secretAccessKey,
          dateStamp,
          conf.region,
          SERVICE
        ) as Uint8Array;

        this._credentialScope = `${dateStamp}/${
          conf.region
        }/${SERVICE}/aws4_request`;

        this._day = day;
      }
    },
    get key(): Uint8Array {
      this._maybeRefresh();

      return this._key;
    },
    get credentialScope(): string {
      this._maybeRefresh();

      return this._credentialScope;
    }
  };
}

/** Base fetch. */
async function baseFetch(conf: Doc, op: string, params: Doc): Promise<Doc> {
  const payload: Uint8Array = encode(JSON.stringify(params), "utf8");

  const headers: Headers = createHeaders(op, payload, conf as HeadersConfig);

  const response: Response = await fetch(conf.endpoint, {
    method: conf.method,
    headers,
    body: payload
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message);
  }
  return body;
}

/** Base op. */
async function baseOp(
  conf: Doc,
  op: string,
  params: Doc = {},
  {
    wrapNumbers = false,
    convertEmptyValues = false,
    translateJSON = true,
    iteratePages = true
  }: OpOptions = NO_PARAMS_OPS.has(op) ? params || {} : {}
): Promise<Doc> {
  let translator: any;
  let outputShape: any;

  if (translateJSON) {
    translator = new Translator({
      wrapNumbers,
      convertEmptyValues,
      attrValue: ATTR_VALUE
    });

    outputShape = API.operations[op].output;

    params = translator.translateInput(params, API.operations[op].input);
  } else {
    params = { ...params };
  }

  let rawResult: Doc = await baseFetch(conf, op, params);

  if (rawResult.LastEvaluatedKey && iteratePages) {
    let lastEvaluatedKey: any = rawResult.LastEvaluatedKey;
    let first: boolean = true;

    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<Doc> {
        return this;
      },
      async next(): Promise<IteratorResult<Doc>> {
        if (!lastEvaluatedKey) {
          return { value: {}, done: true };
        }

        if (first) {
          first = false;

          lastEvaluatedKey = rawResult.LastEvaluatedKey;

          if (!translateJSON) {
            return {
              value: rawResult,
              done: false
            };
          } else {
            return {
              value: translator.translateOutput(rawResult, outputShape),
              done: false
            };
          }
        } else {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        rawResult = await baseFetch(conf, op, params);

        lastEvaluatedKey = rawResult.LastEvaluatedKey;

        if (!translateJSON) {
          return { value: rawResult, done: false };
        }

        return {
          value: translator.translateOutput(rawResult, outputShape),
          done: false
        };
      }
    };
  }

  if (!translateJSON) {
    return rawResult;
  }

  return translator.translateOutput(rawResult, outputShape);
}

/** Creates a DynamoDB client. */
export function createClient(conf: ClientConfig): DynamoDBClient {
  if (!conf.accessKeyId || !conf.secretAccessKey || !conf.region) {
    throw new TypeError(
      "client config must include accessKeyId, secretAccessKey and region"
    );
  }

  const host: string =
    conf.region === "local"
      ? "localhost"
      : `dynamodb.${conf.region}.amazonaws.com`;

  const endpoint: string = `http${
    conf.region === "local" ? "" : "s"
  }://${host}:${conf.port || 8000}/`;

  const _conf: Doc = {
    ...conf,
    cache: createCache(conf),
    method: "POST",
    host,
    endpoint
  };

  const ddbc: DynamoDBClient = {} as DynamoDBClient;

  for (const op of OPS) {
    ddbc[camelCase(op)] = baseOp.bind(null, _conf, op);
  }

  return ddbc;
}
