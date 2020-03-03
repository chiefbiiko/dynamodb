import {
  assertEquals,
  test,
  runIfMain
} from "https://deno.land/std@v0.32.0/testing/mod.ts";

import { encode } from "../deps.ts";
import { awsSignatureV4, kdf } from "../client/aws_signature_v4.ts";

test({
  name: "aws signature v4 flow",
  fn(): void {
    const expectedSignature: string =
      "31fac5ed29db737fbcafac527470ca6d9283283197c5e6e94ea40ddcec14a9c1";

    const key: Uint8Array = kdf(
      "secret",
      "20310430",
      "region",
      "dynamodb",
      "utf8"
    ) as Uint8Array;

    const msg: Uint8Array = encode(
      "AWS4-HMAC-SHA256\n20310430T201613Z\n20310430/region/dynamodb/aws4_request\n4be20e7bf75dc6c7e93873b5f49096771729b8a28f0c62010db431fea79220ef",
      "utf8"
    );

    const actualSignature: string = awsSignatureV4(key, msg, "hex") as string;

    assertEquals(actualSignature, expectedSignature);
  }
});

runIfMain(import.meta);
