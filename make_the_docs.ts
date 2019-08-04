import { OPS, NO_PARAMS_OPS } from "./mod.ts";
import { Doc } from "./util.ts";

const README0: string = `
# dynamodb

[![Travis](http://img.shields.io/travis/chiefbiiko/dynamodb.svg?style=flat)](http://travis-ci.org/chiefbiiko/dynamodb) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/dynamodb?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/dynamodb)

DynamoDB client.

## Usage

\`\`\` ts
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
\`\`\`

## API

### Contents

<CONTENTS/>

### Basics

\`\`\` ts
/** Generic document. */
export interface Doc {
  [key: string]: any;
}

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  describeEndpoints: (options?: Doc) => Promise<Doc>;
  describeLimits: (options?: Doc) => Promise<Doc>;
  listTables: (options?: Doc) => Promise<Doc>;
  scan: (params?: Doc, options?: Doc) => Promise<Doc | AsyncIterableIterator<Doc>>;
  query: (params?: Doc, options?: Doc) => Promise<Doc | AsyncIterableIterator<Doc>>;
  [key: string]: (params?: Doc, options?: Doc) => Promise<Doc>;
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
\`\`\`

### Factory

#### createClient

##### \`createClient(conf: ClientConfig): DynamoDBClient\`

Creates a DynamoDB client.

### Ops

<OPS/>

## FYI

Don't want to do all development against the real AWS cloud?

+ [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)

+ [DynamoDB GUI](https://github.com/Arattian/DynamoDb-GUI-Client)

## License

[MIT](./LICENSE)

`;

const { contents, ops }: Doc = Array.from(OPS)
  .map(
    (op: string, i: number): Doc => {
      const params: string = NO_PARAMS_OPS.has(op) ? "" : "params: Doc, ";

      const rtn: string = `Promise<${
        op === "Scan" || op === "Query"
          ? "Doc | AsyncIterableIterator<Doc>"
          : "Doc"
      }>`;

      const camel: string = `${op[0].toLowerCase()}${op.slice(1)}`;

      const signature: string = `${camel}(${params}options?: OpOptions): ${rtn}`;

      const tail: string = i === OPS.size - 1 ? "" : "\n\n";

      return {
        contentItem: `    + [${op}](#${op})${tail}`,
        opItem:
          `#### ${op}\n\n##### \`${signature}\`\n\n` +
          `[aws ${op} docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_${op}.html)${tail}`
      };
    }
  )
  .reduce(
    (
      acc: { contents: string[]; ops: string[] },
      { contentItem, opItem }: Doc,
      i: number
    ): Doc => {
      acc.contents[3 + i] = contentItem;
      acc.ops[i] = opItem;

      return acc;
    },
    {
      contents: [
        "1. [Basics](#Basics)\n\n",
        "2. [Factory](#Factory)\n\n",
        "3. [Ops](#Ops)\n\n"
      ].concat(new Array(OPS.size)),
      ops: new Array(OPS.size)
    }
  );

const readTheDocs: string = README0.replace(
  "<CONTENTS/>",
  contents.join("")
).replace("<OPS/>", ops.join(""));

Deno.writeFileSync("./README.md", new TextEncoder().encode(readTheDocs));
