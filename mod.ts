import { baseOp, baseOpIterator, deriveConfig } from "./client/mod.ts";
import { Doc, camelCase } from "./util.ts";

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
  ) => AsyncIterable<Doc>;
  query: (
    params: Doc,
    options?: Doc
  ) => AsyncIterable<Doc>;
  batchGetItem: (params: Doc, options?: Doc) => Promise<Doc>;
  batchWriteItem: (params: Doc, options?: Doc) => Promise<Doc>;
  createBackup: (params: Doc, options?: Doc) => Promise<Doc>;
  createGlobalTable: (params: Doc, options?: Doc) => Promise<Doc>;
  createTable: (params: Doc, options?: Doc) => Promise<Doc>;
  deleteBackup: (params: Doc, options?: Doc) => Promise<Doc>;
  deleteItem: (params: Doc, options?: Doc) => Promise<Doc>;
  deleteTable: (params: Doc, options?: Doc) => Promise<Doc>;
  describeBackup: (params: Doc, options?: Doc) => Promise<Doc>;
  describeContinuousBackups: (params: Doc, options?: Doc) => Promise<Doc>;
  describeGlobalTable: (params: Doc, options?: Doc) => Promise<Doc>;
  describeGlobalTableSettings: (params: Doc, options?: Doc) => Promise<Doc>;
  describeTable: (params: Doc, options?: Doc) => Promise<Doc>;
  describeTimeToLive: (params: Doc, options?: Doc) => Promise<Doc>;
  getItem: (params: Doc, options?: Doc) => Promise<Doc>;
  listBackups: (params: Doc, options?: Doc) => Promise<Doc>;
  listGlobalTables: (params: Doc, options?: Doc) => Promise<Doc>;
  listTagsOfResource: (params: Doc, options?: Doc) => Promise<Doc>;
  putItem: (params: Doc, options?: Doc) => Promise<Doc>;
  restoreTableFromBackup: (params: Doc, options?: Doc) => Promise<Doc>;
  restoreTableToPointInTime: (params: Doc, options?: Doc) => Promise<Doc>;
  tagResource: (params: Doc, options?: Doc) => Promise<Doc>;
  transactGetItems: (params: Doc, options?: Doc) => Promise<Doc>;
  transactWriteItems: (params: Doc, options?: Doc) => Promise<Doc>;
  untagResource: (params: Doc, options?: Doc) => Promise<Doc>;
  updateContinuousBackups: (params: Doc, options?: Doc) => Promise<Doc>;
  updateGlobalTable: (params: Doc, options?: Doc) => Promise<Doc>;
  updateGlobalTableSettings: (params: Doc, options?: Doc) => Promise<Doc>;
  updateItem: (params: Doc, options?: Doc) => Promise<Doc>;
  updateTable: (params: Doc, options?: Doc) => Promise<Doc>;
  updateTimeToLive: (params: Doc, options?: Doc) => Promise<Doc>;
}

/** Credentials. */
export interface Credentials {
  accessKeyId: string; // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string; // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  sessionToken?: string; // somesessiontoken
}

/** Client configuration. */
export interface ClientConfig {
  credentials?: Credentials | (() => Credentials | Promise<Credentials>);
  region?: string; // us-west-2
  profile?: string; // default
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 80
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

/** Creates a DynamoDB client. */
export function createClient(conf?: ClientConfig): DynamoDBClient {
  const _conf: Doc = deriveConfig(conf);

  const dyno: DynamoDBClient = {} as DynamoDBClient;

  for (const op of OPS) {
    if (op === "Query" || op === "Scan") {
      dyno[camelCase(op)] = baseOpIterator.bind(null, _conf, op);
    } else {
      dyno[camelCase(op)] = baseOp.bind(null, _conf, op);
    }
  }

  return dyno;
}
