import { sha256 } from "https://denopkg.com/chiefbiiko/sha256/mod.ts";
import { hmac } from "https://denopkg.com/chiefbiiko/hmac/mod.ts";
import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { awsv4SignatureKDF } from "./awsv4signature_kdf.ts";
import { formatAmzDate, formatDateStamp } from "./format_date.ts";
import { ClientConfig } from "./create_client.ts";

/** Service name. */
const SERVICE: string = "dynamodb";

/** Algorithm identifer. */
const ALGORITHM: string = "AWS4-HMAC-SHA256";

/** Content type header value for POST requests. */
const POST_CONTENT_TYPE: string = "application/x-amz-json-1.0";

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
  const amzTarget: string = `DynamoDB_20120810.${conf.op}`;
  const date: Date = conf.date || new Date();
  const amzDate: string = formatAmzDate(date);
  const dateStamp: string = formatDateStamp(date);
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

  const credentialScope: string = `${dateStamp}/${
    conf.region
  }/${SERVICE}/aws4_request`;

  const msg: Uint8Array = encode(
    `${ALGORITHM}\n${amzDate}\n${credentialScope}\n${canonicalRequestDigest}`,
    "utf8"
  );

  const key: Uint8Array = awsv4SignatureKDF(
    conf.secretAccessKey,
    dateStamp,
    conf.region,
    SERVICE
  ) as Uint8Array;

  const signature: string = hmac("sha256", key, msg, null, "hex") as string;

  const authorizationHeader: string = `${ALGORITHM} Credential=${
    conf.accessKeyId
  }/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Headers = new Headers({
    "Content-Type": POST_CONTENT_TYPE,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": amzTarget,
    Authorization: authorizationHeader
  });

  return headers;
}
