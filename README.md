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

// the client has all of DynamoDB's operations as camelCased async methods.
const ddbc = createClient(conf);

// imagine a world with top-level await
const result = await ddbc.listTables();
```

## API

#### `createClient(conf: ClientConfig): DynamoDBClient`

Creates a DynamoDB client.

#### `DynamoDBClient#<Operation>(params?: Document, options?: OpOptions): Promise<Document>`

Performs a DynamoDB operation.

#### Basics

``` ts
/** Generic document. */
export interface Document {
  [key: string]: any;
}

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
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

## FYI

Don't want to do all development against the real AWS cloud?

+ [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)

+ [DynamoDB GUI](https://github.com/Arattian/DynamoDb-GUI-Client)
