import { get } from "../deps.ts";
import { ClientConfig } from "../mod.ts";
import { Doc } from "../util.ts";
import { createCache } from "./create_cache.ts";

/** Derives host and endpoint. */
function deriveHostEndpoint(
  region: string,
  port: number
): { host: string; endpoint: string } {
  let host: string;
  let endpoint: string;

  if (region === "local") {
    host = "localhost";
    endpoint = `http://${host}:${port || 8000}/`;
  } else {
    host = `dynamodb.${region}.amazonaws.com`;
    endpoint = `https://${host}:443/`;
  }

  return { host, endpoint };
}

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
    const got: Doc = get({ profile: _conf.profile });

    if (typeof _conf.credentials !== "function") {
      _conf.credentials = {
        accessKeyId: got.accessKeyId,
        secretAccessKey: got.secretAccessKey,
        sessionToken: got.sessionToken,
        ..._conf.credentials
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

  return {
    ..._conf,
    cache: createCache(_conf),
    method: "POST",
    ...deriveHostEndpoint(_conf.region!, _conf.port!)
  };
}
