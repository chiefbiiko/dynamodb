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

/** Credentials. */
export interface Credentials {
  accessKeyId: string; // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string; // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  sessionToken?: string; // somesessiontoken
}

/** Client configuration. */
export interface ClientConfig {
  credentials: Credentials | (() => Credentials | Promise<Credentials>);
  region: string; // us-west-2
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 80
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
function createCache(conf: ClientConfig): Doc {
  return {
    _credentialScope: "",
    _key: null,
    _accessKeyId: "",
    _sessionToken: "",
    async refresh(): Promise<void> {
      const dateStamp: string = date.format(new Date(), "dateStamp");

      let credentials: Credentials;

      if (typeof conf.credentials === "function") {
        credentials = await conf.credentials();
      } else {
        credentials = conf.credentials;
      }

      this._key = kdf(
        credentials.secretAccessKey,
        dateStamp,
        conf.region,
        SERVICE
      ) as Uint8Array;

      this._credentialScope = `${dateStamp}/${conf.region}/${SERVICE}/aws4_request`;
      this._accessKeyId = credentials.accessKeyId;
      this._sessionToken = credentials.sessionToken;
    },
    get key(): Uint8Array {
      return this._key;
    },
    get credentialScope(): string {
      return this._credentialScope;
    },
    get accessKeyId(): string {
      return this._accessKeyId;
    },
    get sessionToken(): string {
      return this._sessionToken;
    }
  };
}

/** Base fetch. */
async function baseFetch(conf: Doc, op: string, params: Doc): Promise<Doc> {
  const payload: Uint8Array = encode(JSON.stringify(params), "utf8");

  let headers: Headers = await createHeaders(
    op,
    payload,
    conf as HeadersConfig
  );

  let response: Response = await fetch(conf.endpoint, {
    method: conf.method,
    headers,
    body: payload
  });

  let body: Doc = await response.json();

  if (!response.ok) {
    if (response.status === 403) {
      // retry once with refreshed credenttials
      headers = await createHeaders(op, payload, conf as HeadersConfig, true);

      response = await fetch(conf.endpoint, {
        method: conf.method,
        headers,
        body: payload
      });

      if (response.ok) {
        body = await response.json();

        return body;
      }
    }

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
  const host: string =
    conf.region === "local"
      ? "localhost"
      : `dynamodb.${conf.region}.amazonaws.com`;

  const endpoint: string = `http${
    conf.region === "local" ? "" : "s"
  }://${host}:${conf.port || 80}/`;

  const _conf: Doc = {
    ...conf,
    cache: createCache(conf),
    method: "POST",
    host,
    endpoint
  };

  const dyno: DynamoDBClient = {} as DynamoDBClient;

  for (const op of OPS) {
    dyno[camelCase(op)] = baseOp.bind(null, _conf, op);
  }

  return dyno;
}
