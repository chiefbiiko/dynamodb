import { baseFetch } from "./base_fetch.ts";
import { API } from "../api/mod.ts";
import { Translator } from "./translator.ts";
import { Doc } from "../util.ts";

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

function _translate(rawResult, outputShape, translator: any) {
  if (!translator) {
    return rawResult;
  }
  return translator.translateOutput(rawResult, outputShape);
}

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
    translator = new Translator({
      wrapNumbers,
      convertEmptyValues,
      attrValue: ATTR_VALUE
    });

    outputShape = API.operations[op].output;

    params = translator.translateInput(params, API.operations[op].input);
  } else {
    params = { ...params };
  }

  const rawResult: Doc = await baseFetch(conf, op, params);
  return _translate(rawResult, outputShape, translator)
}

export async function *baseOpIterator(
  conf: Doc,
  op: string,
  params: Doc = {},
  {
    wrapNumbers = false,
    convertEmptyValues = false,
    translateJSON = true,
    iteratePages = true
  }: OpOptions = NO_PARAMS_OPS.has(op) ? params || {} : {}
): AsyncIterator<Doc> {
  let translator: any;
  let outputShape: any;

  if (translateJSON) {
    translator = new Translator({
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
  yield _translate(rawResult, outputShape, translator);

  while (iteratePages && rawResult.LastEvaluatedKey) {
    params.ExclusiveStartKey = rawResult.LastEvaluatedKey;
    rawResult = await baseFetch(conf, op, params);
    yield _translate(rawResult, outputShape, translator);
  }
}
