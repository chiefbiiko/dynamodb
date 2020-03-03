import { encode, decode, hmac } from "../deps.ts";
import { date } from "../util.ts";

/** Some magic bytes. */
const AWS4: Uint8Array = encode("AWS4", "utf8");

/** Creates a HMAC-SHA256 mac.*/
export function awsSignatureV4(
  key: Uint8Array,
  msg: Uint8Array,
  outputEncoding?: string
): string | Uint8Array {
  return hmac("sha256", key, msg, undefined, outputEncoding);
}

/** Creates a key for generating an aws signature version 4. */
export function kdf(
  key: string | Uint8Array,
  dateStamp: Date | string,
  region: string,
  service: string,
  keyInputEncoding?: string,
  outputEncoding?: string
): string | Uint8Array {
  if (typeof key === "string") {
    key = encode(key, keyInputEncoding) as Uint8Array;
  }

  if (typeof dateStamp !== "string") {
    dateStamp = date.format(dateStamp, "dateStamp");
  } else if (!date.DATE_STAMP_REGEX.test(dateStamp)) {
    throw new TypeError("date stamp format must be yyyymmdd");
  }

  const paddedKey: Uint8Array = new Uint8Array(4 + key.byteLength);

  paddedKey.set(AWS4, 0);
  paddedKey.set(key, 4);

  let mac: Uint8Array = hmac(
    "sha256",
    paddedKey,
    dateStamp as string,
    "utf8"
  ) as Uint8Array;

  mac = hmac("sha256", mac, region, "utf8") as Uint8Array;

  mac = hmac("sha256", mac, service, "utf8") as Uint8Array;

  mac = hmac("sha256", mac, "aws4_request", "utf8") as Uint8Array;

  return outputEncoding ? decode(mac, outputEncoding) : mac;
}
