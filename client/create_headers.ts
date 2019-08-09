import { sha256 } from "https://denopkg.com/chiefbiiko/sha256/mod.ts";
import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { awsSignatureV4 } from "./aws_signature_v4.ts";
import { Doc, date } from "./../util.ts";
import { ClientConfig } from "./../mod.ts";

/** Algorithm identifer. */
const ALGORITHM: string = "AWS4-HMAC-SHA256";

/** Content type header value for POST requests. */
const POST_CONTENT_TYPE: string = "application/x-amz-json-1.0";

/** Required configuration for assembling headers. */
export interface HeadersConfig extends ClientConfig {
  host: string; // dynamodb.us-west-2.amazonaws.com
  method: string; // POST
  cache: Doc; // internal cache for expensive-2-make signing key (& credScope)
  date?: Date; // allows reusing a date for 5min (max signature timestamp diff)
}

/** Assembles a header object for a DynamoDB request. */
export function createHeaders(
  op: string,
  payload: Uint8Array,
  conf: HeadersConfig
): Headers {
  const amzTarget: string = `DynamoDB_20120810.${op}`;

  const amzDate: string = date.format(conf.date || new Date(), "amz");

  const canonicalUri: string = conf.canonicalUri || "/";

  const canonicalHeaders: string = `content-type:${POST_CONTENT_TYPE}\nhost:${
    conf.host
  }\nx-amz-date:${amzDate}\nx-amz-target:${amzTarget}\n`;

  const signedHeaders: string = "content-type;host;x-amz-date;x-amz-target";

  const payloadHash: string = sha256(payload, null, "hex") as string;

  const canonicalRequest: string = `${
    conf.method
  }\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const canonicalRequestDigest: string = sha256(
    canonicalRequest,
    "utf8",
    "hex"
  ) as string;

  const msg: Uint8Array = encode(
    `${ALGORITHM}\n${amzDate}\n${
      conf.cache.credentialScope
    }\n${canonicalRequestDigest}`,
    "utf8"
  );

  const signature: string = awsSignatureV4(
    conf.cache.key,
    msg,
    "hex"
  ) as string;

  const authorizationHeader: string = `${ALGORITHM} Credential=${
    conf.accessKeyId
  }/${
    conf.cache.credentialScope
  }, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return new Headers({
    "Content-Type": POST_CONTENT_TYPE,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": amzTarget,
    Authorization: authorizationHeader
  });
}
