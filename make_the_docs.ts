import { OPS } from "./mod.ts";
import { NO_PARAMS_OPS } from "./client/base_op.ts";
import { Doc } from "./util.ts";

const README0: string = `
# dynamodb

![ci](https://github.com/chiefbiiko/dynamodb/workflows/ci/badge.svg?branch=master)

DynamoDB client.

## Usage

\`\`\` ts
import { createClient } from "https://denopkg.com/chiefbiiko/dynamodb/mod.ts";

// if config/credentials not passed they will be read from the env/fs
const dyno = createClient();

// the client has all of DynamoDB's operations as camelCased async methods
const result = await dyno.listTables();
\`\`\`

The client config can be omitted entirely when calling \`createClient\`. If that is the case the config will be derived from the environment and filesystem, in that order, using [\`get-aws-config\`](https://github.com/chiefbiiko/get-aws-config).

Prefer using temporary credentials and a session token.

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
  credentials?: Credentials | (() => Credentials | Promise<Credentials>);
  region?: string; // us-west-2
  profile?: string; // default
  canonicalUri?: string; // fx /path/to/somewhere
  port?: number; // 80
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

The client supports all DynamoDB operations. Check the linked aws docs for info about parameters of a specific operation.

<OPS/>

## FYI

Don't want to do all development against the real AWS cloud?

+ [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)

+ [DynamoDB GUI](https://github.com/Arattian/DynamoDb-GUI-Client)

## License

[MIT](./LICENSE)

`.trim();

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
