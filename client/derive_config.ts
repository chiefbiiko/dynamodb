import { get } from "../deps.ts";
import { ClientConfig } from "../mod.ts";
import { Doc } from "../util.ts";
import { createCache } from "./create_cache.ts";

/** Derives an internal config object from a ClientConfig. */
export function deriveConfig(conf: ClientConfig = {}): Doc {
  const _conf: ClientConfig = { ...conf };

  if (
    _conf.profile ||
    !_conf.region ||
    !_conf.credentials ||
    (typeof _conf.credentials !== "function" &&
      (!_conf.credentials.accessKeyId || !_conf.credentials.secretAccessKey))
  ) {
    const got: Doc = get({ profile: _conf.profile || "default" });

    if (typeof _conf.credentials !== "function") {
      _conf.credentials = {
        ...got.credentials,
        ..._conf.credentials,
        accessKeyId: got.accessKeyId,
        secretAccessKey: got.secretAccessKey
      };
    }

    _conf.region = got.region;

    if (
      typeof _conf.credentials !== "function" &&
      (!_conf.region ||
        !_conf.credentials.accessKeyId ||
        !_conf.credentials.secretAccessKey)
    ) {
      throw new Error("unable to derive aws config");
    }
  }

  const host: string =
    _conf.region === "local"
      ? "localhost"
      : `dynamodb.${_conf.region}.amazonaws.com`;

  const endpoint: string = `http${
    _conf.region === "local" ? "" : "s"
  }://${host}:${_conf.port || 443}/`;

  return {
    ..._conf,
    cache: createCache(_conf),
    method: "POST",
    host,
    endpoint
  };
}
