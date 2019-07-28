
# dynamodb

[![Travis](http://img.shields.io/travis/chiefbiiko/dynamodb.svg?style=flat)](http://travis-ci.org/chiefbiiko/dynamodb) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/dynamodb?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/dynamodb)

DynamoDB client.

## Usage

``` ts
import { createClient } from "https://denopkg.com/chiefbiiko/dynamodb/mod.ts";

// minimal config to create a client
const conf = {
  accessKeyId: "abc",
  secretAccessKey: "def",
  region: "local"
}

// the client has all of DynamoDB's operations as camelCased async methods
const ddbc = createClient(conf);

// imagine a world with top-level await
const result = await ddbc.listTables();
```

## API

### Contents

 + [Basics](#Basics)

 + [Factory](#Factory)

 + [Ops](#Ops)

  + [BatchGetItem](#BatchGetItem)

  + [BatchWriteItem](#BatchWriteItem)

  + [CreateBackup](#CreateBackup)

  + [CreateGlobalTable](#CreateGlobalTable)

  + [CreateTable](#CreateTable)

  + [DeleteBackup](#DeleteBackup)

  + [DeleteItem](#DeleteItem)

  + [DeleteTable](#DeleteTable)

  + [DescribeBackup](#DescribeBackup)

  + [DescribeContinuousBackups](#DescribeContinuousBackups)

  + [DescribeEndpoints](#DescribeEndpoints)

  + [DescribeGlobalTable](#DescribeGlobalTable)

  + [DescribeGlobalTableSettings](#DescribeGlobalTableSettings)

  + [DescribeLimits](#DescribeLimits)

  + [DescribeTable](#DescribeTable)

  + [DescribeTimeToLive](#DescribeTimeToLive)

  + [GetItem](#GetItem)

  + [ListBackups](#ListBackups)

  + [ListGlobalTables](#ListGlobalTables)

  + [ListTables](#ListTables)

  + [ListTagsOfResource](#ListTagsOfResource)

  + [PutItem](#PutItem)

  + [Query](#Query)

  + [RestoreTableFromBackup](#RestoreTableFromBackup)

  + [RestoreTableToPointInTime](#RestoreTableToPointInTime)

  + [Scan](#Scan)

  + [TagResource](#TagResource)

  + [TransactGetItems](#TransactGetItems)

  + [TransactWriteItems](#TransactWriteItems)

  + [UntagResource](#UntagResource)

  + [UpdateContinuousBackups](#UpdateContinuousBackups)

  + [UpdateGlobalTable](#UpdateGlobalTable)

  + [UpdateGlobalTableSettings](#UpdateGlobalTableSettings)

  + [UpdateItem](#UpdateItem)

  + [UpdateTable](#UpdateTable)

  + [UpdateTimeToLive](#UpdateTimeToLive)

### Basics

``` ts
/** Generic document. */
export interface Document {
  [key: string]: any;
}

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  describeEndpoints: (options?: Document) => Promise<Document>;
  describeLimits: (options?: Document) => Promise<Document>;
  listTables: (options?: Document) => Promise<Document>;
  scan: (params?: Document, options?: Document) => Promise<Document | AsyncIterableIterator<Document>>;
  query: (params?: Document, options?: Document) => Promise<Document | AsyncIterableIterator<Document>>;
  [key: string]: (params?: Document, options?: Document) => Promise<Document>;
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
  wrapNumbers?: boolean, // wrap numbers to a special number value type? [false]
  convertEmptyValues?: boolean, // convert empty strings and binaries? [false]
  translateJSON?: boolean, // translate I/O JSON schemas? [true]
  iteratePages?: boolean // if a result is paged, async-iterate it? [true]
}
```

### Factory

#### createClient

##### `createClient(conf: ClientConfig): DynamoDBClient`

Creates a DynamoDB client.

### Ops

#### BatchGetItem

##### `batchGetItem(params: Document, options?: OpOptions): Promise<Document>`

[aws BatchGetItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html)

#### BatchWriteItem

##### `batchWriteItem(params: Document, options?: OpOptions): Promise<Document>`

[aws BatchWriteItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html)

#### CreateBackup

##### `createBackup(params: Document, options?: OpOptions): Promise<Document>`

[aws CreateBackup docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateBackup.html)

#### CreateGlobalTable

##### `createGlobalTable(params: Document, options?: OpOptions): Promise<Document>`

[aws CreateGlobalTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateGlobalTable.html)

#### CreateTable

##### `createTable(params: Document, options?: OpOptions): Promise<Document>`

[aws CreateTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html)

#### DeleteBackup

##### `deleteBackup(params: Document, options?: OpOptions): Promise<Document>`

[aws DeleteBackup docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteBackup.html)

#### DeleteItem

##### `deleteItem(params: Document, options?: OpOptions): Promise<Document>`

[aws DeleteItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html)

#### DeleteTable

##### `deleteTable(params: Document, options?: OpOptions): Promise<Document>`

[aws DeleteTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteTable.html)

#### DescribeBackup

##### `describeBackup(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeBackup docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeBackup.html)

#### DescribeContinuousBackups

##### `describeContinuousBackups(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeContinuousBackups docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeContinuousBackups.html)

#### DescribeEndpoints

##### `describeEndpoints(options?: OpOptions): Promise<Document>`

[aws DescribeEndpoints docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeEndpoints.html)

#### DescribeGlobalTable

##### `describeGlobalTable(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeGlobalTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeGlobalTable.html)

#### DescribeGlobalTableSettings

##### `describeGlobalTableSettings(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeGlobalTableSettings docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeGlobalTableSettings.html)

#### DescribeLimits

##### `describeLimits(options?: OpOptions): Promise<Document>`

[aws DescribeLimits docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeLimits.html)

#### DescribeTable

##### `describeTable(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTable.html)

#### DescribeTimeToLive

##### `describeTimeToLive(params: Document, options?: OpOptions): Promise<Document>`

[aws DescribeTimeToLive docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DescribeTimeToLive.html)

#### GetItem

##### `getItem(params: Document, options?: OpOptions): Promise<Document>`

[aws GetItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html)

#### ListBackups

##### `listBackups(params: Document, options?: OpOptions): Promise<Document>`

[aws ListBackups docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListBackups.html)

#### ListGlobalTables

##### `listGlobalTables(params: Document, options?: OpOptions): Promise<Document>`

[aws ListGlobalTables docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListGlobalTables.html)

#### ListTables

##### `listTables(options?: OpOptions): Promise<Document>`

[aws ListTables docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListTables.html)

#### ListTagsOfResource

##### `listTagsOfResource(params: Document, options?: OpOptions): Promise<Document>`

[aws ListTagsOfResource docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ListTagsOfResource.html)

#### PutItem

##### `putItem(params: Document, options?: OpOptions): Promise<Document>`

[aws PutItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html)

#### Query

##### `query(params: Document, options?: OpOptions): Promise<Document | AsyncIterableIterator<Document>>`

[aws Query docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)

#### RestoreTableFromBackup

##### `restoreTableFromBackup(params: Document, options?: OpOptions): Promise<Document>`

[aws RestoreTableFromBackup docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_RestoreTableFromBackup.html)

#### RestoreTableToPointInTime

##### `restoreTableToPointInTime(params: Document, options?: OpOptions): Promise<Document>`

[aws RestoreTableToPointInTime docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_RestoreTableToPointInTime.html)

#### Scan

##### `scan(params: Document, options?: OpOptions): Promise<Document | AsyncIterableIterator<Document>>`

[aws Scan docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html)

#### TagResource

##### `tagResource(params: Document, options?: OpOptions): Promise<Document>`

[aws TagResource docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TagResource.html)

#### TransactGetItems

##### `transactGetItems(params: Document, options?: OpOptions): Promise<Document>`

[aws TransactGetItems docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactGetItems.html)

#### TransactWriteItems

##### `transactWriteItems(params: Document, options?: OpOptions): Promise<Document>`

[aws TransactWriteItems docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html)

#### UntagResource

##### `untagResource(params: Document, options?: OpOptions): Promise<Document>`

[aws UntagResource docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UntagResource.html)

#### UpdateContinuousBackups

##### `updateContinuousBackups(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateContinuousBackups docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateContinuousBackups.html)

#### UpdateGlobalTable

##### `updateGlobalTable(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateGlobalTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateGlobalTable.html)

#### UpdateGlobalTableSettings

##### `updateGlobalTableSettings(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateGlobalTableSettings docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateGlobalTableSettings.html)

#### UpdateItem

##### `updateItem(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateItem docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html)

#### UpdateTable

##### `updateTable(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateTable docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateTable.html)

#### UpdateTimeToLive

##### `updateTimeToLive(params: Document, options?: OpOptions): Promise<Document>`

[aws UpdateTimeToLive docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateTimeToLive.html)

## FYI

Don't want to do all development against the real AWS cloud?

+ [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)

+ [DynamoDB GUI](https://github.com/Arattian/DynamoDb-GUI-Client)

## License

[MIT](./LICENSE)

