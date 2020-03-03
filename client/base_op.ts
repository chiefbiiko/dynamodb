import { baseFetch } from "./base_fetch.ts";
import { API } from "../api/mod.ts";
import { Translator } from "./translator.ts";
import { Doc } from "../util.ts";

// ts strict food
const _Translator: any = Translator;

/** Op options. */
export interface OpOptions {
  wrapNumbers?: boolean; // wrap numbers to a special number value type? [false]
  convertEmptyValues?: boolean; // convert empty strings and binaries? [false]
  translateJSON?: boolean; // translate I/O JSON schemas? [true]
  iteratePages?: boolean; // if a result is paged, async-iterate it? [true]
}

/** DynamoDB operations that do not take any parameters. */
export const NO_PARAMS_OPS: Set<string> = new Set<string>([
  "DescribeEndpoints",
  "DescribeLimits",
  "ListTables"
]);

/** Base shape of all DynamoDB query schemas. */
const ATTR_VALUE: string =
  API.operations.PutItem.input.members.Item.value.shape;

/** Base op. */
export async function baseOp(
  conf: Doc,
  op: string,
  params: Doc = {},
  {
    wrapNumbers = false,
    convertEmptyValues = false,
    translateJSON = true,
    iteratePages = true
  }: OpOptions = NO_PARAMS_OPS.has(op) ? params || {} : {}
): Promise<Doc> {
  let translator: any;
  let outputShape: any;

  if (translateJSON) {
    translator = new _Translator({
      wrapNumbers,
      convertEmptyValues,
      attrValue: ATTR_VALUE
    });

    outputShape = API.operations[op].output;

    params = translator.translateInput(params, API.operations[op].input);
  } else {
    params = { ...params };
  }

  let rawResult: Doc = await baseFetch(conf, op, params);

  if (rawResult.LastEvaluatedKey && iteratePages) {
    let lastEvaluatedKey: any = rawResult.LastEvaluatedKey;
    let first: boolean = true;

    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<Doc> {
        return this as AsyncIterableIterator<Doc>;
      },
      async next(): Promise<IteratorResult<Doc>> {
        if (!lastEvaluatedKey) {
          return { value: {}, done: true };
        }

        if (first) {
          first = false;

          lastEvaluatedKey = rawResult.LastEvaluatedKey;

          if (!translateJSON) {
            return {
              value: rawResult,
              done: false
            };
          } else {
            return {
              value: translator.translateOutput(rawResult, outputShape),
              done: false
            };
          }
        } else {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        rawResult = await baseFetch(conf, op, params);

        lastEvaluatedKey = rawResult.LastEvaluatedKey;

        if (!translateJSON) {
          return { value: rawResult, done: false };
        }

        return {
          value: translator.translateOutput(rawResult, outputShape),
          done: false
        };
      }
    };
  }

  if (!translateJSON) {
    return rawResult;
  }

  return translator.translateOutput(rawResult, outputShape);
}
