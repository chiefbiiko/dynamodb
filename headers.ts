import { sha256 } from "https://denopkg.com/chiefbiiko/sha256/mod.ts";
import {hmac} from "https://denopkg.com/chiefbiiko/hmac/mod.ts"
import {awsv4kdf} from "./awsv4kdf.ts"
import { formatAmzDate, formatDateStamp } from "./dates.ts"
import { encode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
/** Service name. */
  const SERVICE: string = "dynamodb"

/** Algorithm identifer. */
const ALGORITHM:string = 'AWS4-HMAC-SHA256'

/** HTTP methods that DynamoDB supports. */
const SUPPORTED_HTTP_METHODS: Set<string> = new Set([ "get", "GET",  "post","POST"])

/** Content type header value for POST requests. */
const POST_CONTENT_TYPE: string =  'application/x-amz-json-1.0'

/** Required configuration for assembling headers. */
export interface HeaderConfig {

  accessKeyId: string // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

  region: string // us-west-2

  canonicalUri?: string // fx /path/to/somewhere
  // canonicalQuerystring?: string // will probly leak stuff

      method: string // POST
        op: string // CreateTable
            payload?: Uint8Array
  date?:Date // allows reusing a date for 5min (max signature timestamp diff)
}

/** Assembles a header object. */
export function createHeaders(conf: HeaderConfig): Headers {
  if (!SUPPORTED_HTTP_METHODS.has(conf.method)) {
    throw new TypeError("unsupported http method")
  }
  
  const isPOST: boolean = conf.method === "post" || conf.method === "POST"
  const host: string = conf.region === "local" ? "localhost" : `dynamodb.${conf.region}.amazonaws.com`
  const amzTarget: string = `DynamoDB_20120810.${conf.op}`
  // const endpoint: string = `http${host === "localhost" ? "" : "s"}://${host}`;
  const date: Date = conf.date || new Date()
  const amzDate: string = formatAmzDate(date)
  const dateStamp: string = formatDateStamp(date)
  const canonicalUri: string = conf.canonicalUri ||"/"
  const canonicalHeaders: string = 
  // 'content-type:' + content_type + '\n' + 'host:' + host + '\n' + 'x-amz-date:' + amz_date + '\n' + 'x-amz-target:' + amz_target + '\n'
  `${isPOST ? `content-type:${POST_CONTENT_TYPE}\n` : ""}host:${host}\nx-amz-date:${amzDate}\nx-amz-target:${amzTarget}\n`
  const signedHeaders: string = isPOST ? 'content-type;host;x-amz-date;x-amz-target' : 'host;x-amz-date;x-amz-target' 
  // TODO: what happens in case of GET set payload to an empty buf?
  const payloadHash: string = sha256(conf.payload, null, "hex") 
  const canonicalRequest: string = 
   // method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash
   `${conf.method.trim().toUpperCase()}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    const canonicalRequestDigest: string = sha256(canonicalRequest, "utf8", "hex")
  const credentialScope : string = 
  // date_stamp + '/' + region + '/' + service + '/' + 'aws4_request'
  `${dateStamp}/${conf.region}/${SERVICE}/aws4_request`
  const msg: string = 
   // algorithm + '\n' +  amz_date + '\n' +  credential_scope + '\n' +  hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
   encode(`${ALGORITHM}\n${amzDate}\n${credentialScope}\n${canonicalRequestDigest}`, "utf8" )
  const key: Uint8Array = awsv4kdf(conf.secretAccessKey, dateStamp, conf.region, SERVICE)
  const signature: string = hmac("sha256", key, msg, null, "hex")
  const authorizationHeader: string = `${ALGORITHM} Credential=${conf.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  const headers: Headers =new Headers({
             'X-Amz-Date':amzDate,
             'X-Amz-Target':amzTarget,
             'Authorization':authorizationHeader})
             
             if (isPOST) {
               headers.set("Content-Type", POST_CONTENT_TYPE) 
             }
  
return headers
}