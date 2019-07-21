/**
# Key derivation functions. See:
# http://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-python
def sign(key, msg):
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

def getSignatureKey(key, date_stamp, regionName, serviceName):
    kDate = sign(('AWS4' + key).encode('utf-8'), date_stamp)
    kRegion = sign(kDate, regionName)
    kService = sign(kRegion, serviceName)
    kSigning = sign(kService, 'aws4_request')
    return kSigning
*/

import { encode, decode } from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { hmac } from "https://denopkg.com/chiefbiiko/hmac/mod.ts";
import { DATE_STAMP_REGEX, formatDateStamp } from "./dates.ts"

/** Some magic bytes. */
const AWS4: Uint8Array = encode("AWS4", "utf8");

// /** Amazon date regex. */
// const AMZ_DATE_REGEX:RegExp = /^\d{8}T\d{6}Z$/
// 
// /** Datestamp regex. */
// const DATE_STAMP_REGEX:RegExp = /^\d{8}$/

/** Creates a key for generating an aws signature version 4. */
export function awsv4SignatureKDF(key: string | Uint8Array, dateStamp: Date | string, region:string, service:string, keyInputEncoding?:string, outputEncoding?:string): string | Uint8Array {
  if (typeof key === "string") {
    key = encode(key, keyInputEncoding) as Uint8Array;
  }
  
  if (typeof dateStamp !== "string") {
    dateStamp = formatDateStamp(dateStamp)
  } else if (!DATE_STAMP_REGEX.test(dateStamp)) {
    throw new TypeError("date stamp format must be yyyymmdd")
  }
  
  const paddedKey: Uint8Array = new Uint8Array(4 + key.byteLength);
  paddedKey.set(AWS4, 0);
  paddedKey.set(key, 4);
  
  let mac: Uint8Array = hmac("sha256", paddedKey, dateStamp, "utf8")
  mac = hmac("sha256", mac, region, "utf8")
  mac = hmac("sha256", mac, service, "utf8")
    mac = hmac("sha256", mac, "aws4_request", "utf8")
    
  return outputEncoding ? decode(mac, outputEncoding): mac;
}