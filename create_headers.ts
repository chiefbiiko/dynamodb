import { sha256 } from "https://denopkg.com/chiefbiiko/sha256/mod.ts";
import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { awsv4Signature, kdf } from "./awsv4signature.ts";
import { Document, date } from "./util.ts";
import { ClientConfig } from "./mod.ts";

/** Service name. */
const SERVICE: string = "dynamodb";

/** Algorithm identifer. */
const ALGORITHM: string = "AWS4-HMAC-SHA256";

/** Content type header value for POST requests. */
const POST_CONTENT_TYPE: string = "application/x-amz-json-1.0";

/** Cache for credentialScope and expensive signature key. */
function createCache(conf: Document): Document {
  return {
    _day: "",
      _credentialScope: "",
    _key: null,
    _maybeRefresh():void {
      const d: Date = new Date()
      const day: string = d.toISOString().slice(8,10)

      if (this._day !== day) {
        // the key and credentialScope values are obsolete
        const dateStamp: string = date.format(d, "dateStamp")

        this._key = kdf(
          conf.secretAccessKey,
          dateStamp,
          conf.region,
          SERVICE
        ) as Uint8Array;

        this._credentialScope = `${dateStamp}/${ conf.region }/${SERVICE}/aws4_request`;

        this._day = day
      }
    },
      get key(): Uint8Array {
        this._maybeRefresh();

        return this._key
      },
      get credentialScope(): string {
        this._maybeRefresh();

        return this._credentialScope
      }
  }
}

/** Required configuration for assembling headers. */
export interface HeadersConfig extends ClientConfig {
  host: string; // dynamodb.us-west-2.amazonaws.com
  method: string; // POST
  op: string; // CreateTable
  payload: Uint8Array;
  date?: Date; // allows reusing a date for 5min (max signature timestamp diff)
}

/** Assembles a header object for a DynamoDB request. */
export function createHeaders(conf: HeadersConfig): Headers {
  const cache: Document = createCache(conf)
  const amzTarget: string = `DynamoDB_20120810.${conf.op}`;
  // const d: Date = conf.date || new Date();
  const amzDate: string = date.format(conf.date || new Date(), "amz");
  // const dateStamp: string = date.format(d, "dateStamp");
  const canonicalUri: string = conf.canonicalUri || "/";

  const canonicalHeaders: string = `content-type:${POST_CONTENT_TYPE}\nhost:${
    conf.host
  }\nx-amz-date:${amzDate}\nx-amz-target:${amzTarget}\n`;

  const signedHeaders: string = "content-type;host;x-amz-date;x-amz-target";

  const payloadHash: string = sha256(conf.payload, null, "hex") as string;

  const canonicalRequest: string = `${
    conf.method
  }\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const canonicalRequestDigest: string = sha256(
    canonicalRequest,
    "utf8",
    "hex"
  ) as string;

  // const credentialScope: string = `${dateStamp}/${
  //   conf.region
  // }/${SERVICE}/aws4_request`;

  const msg: Uint8Array = encode(
    `${ALGORITHM}\n${amzDate}\n${cache.credentialScope}\n${canonicalRequestDigest}`,
    "utf8"
  );

  // const key: Uint8Array = kdf(
  //   conf.secretAccessKey,
  //   dateStamp,
  //   conf.region,
  //   SERVICE
  // ) as Uint8Array;

  const signature: string = awsv4Signature(cache.key,msg, "hex") as string

  const authorizationHeader: string = `${ALGORITHM} Credential=${
    conf.accessKeyId
  }/${cache.credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return new Headers({
    "Content-Type": POST_CONTENT_TYPE,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": amzTarget,
    Authorization: authorizationHeader
  });
}
