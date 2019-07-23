// import DynamoDB = require('../../clients/dynamodb');
import { toUint8Array as base64ToUint8Array} from "https://deno.land/x/base64/mod.ts"

import {Document, DynamoDBSet, DynamoDBNumberValue, typeOf} from "./util.ts"

/** Formats a list. */
function formatList(data: any[], options: Document={}): Document {
  const list: Document = {L: []};

  for (let i: number = 0; i < data.length; i++) {
    list['L'].push(Converter.input(data[i], options));
  }

  return list;
}

/** Converts a number. */
function convertNumber(value: string, wrapNumbers: boolean = false): any {
  return wrapNumbers ? new DynamoDBNumberValue(value) : Number(value);
}

/** Formats a map. */
function formatMap(data: Document, options: Document = {}): Document {
  const map:Document = {M: {}};

  for (const key in data) {
    const formatted: Document = Converter.input(data[key], options);

    if (formatted !== void 0) {
      map['M'][key] = formatted;
    }
  }

  return map;
}

/** Formats a set. */
function formatSet(data: Document, options: Document = {}): Document {
  let values: any[] = data.values;

  if (options.convertEmptyValues) {
    values = filterEmptySetValues(data);

    if (values.length === 0) {
      return Converter.input(null);
    }
  }

  const map:Document = {};

  switch (data.type) {
    case 'String': map['SS'] = values; break;
    case 'Binary': map['BS'] = values; break;
    case 'Number': map['NS'] = values.map(function (value) {
      return value.toString();
    });
  }

  return map;
}

/** Filters empty set values. */
function filterEmptySetValues(set: Document): any[] {
    const nonEmptyValues: any[] = [];

    const potentiallyEmptyTypes:Document = {
        String: true,
        Binary: true,
        Number: false
    };

    if (potentiallyEmptyTypes[set.type]) {
        for (let i:number = 0; i < set.values.length; i++) {
            if (set.values[i].length === 0) {
                continue;
            }

            nonEmptyValues.push(set.values[i]);
        }

        return nonEmptyValues;
    }

    return set.values;
}

/** aws DynamoDB req/res document converter. */
export class Converter {

/**
 * Convert a JavaScript value to its equivalent DynamoDB AttributeValue type
 *
 * @param data [any] The data to convert to a DynamoDB AttributeValue
 * @param options [map]
 * @option options convertEmptyValues [Boolean] Whether to automatically
 *                                              convert empty strings, blobs,
 *                                              and sets to `null`
 * @option options wrapNumbers [Boolean]  Whether to return numbers as a
 *                                        NumberValue object instead of
 *                                        converting them to native JavaScript
 *                                        numbers. This allows for the safe
 *                                        round-trip transport of numbers of
 *                                        arbitrary size.
 * @return [map] An object in the Amazon DynamoDB AttributeValue format
 *
 * @see AWS.DynamoDB.Converter.marshall AWS.DynamoDB.Converter.marshall to
 *    convert entire records (rather than individual attributes)
 */
    static input( data: any, options: Document= {} ): Document {
      var type = typeOf(data);
      if (type === 'Object') {
        return formatMap(data, options);
      } else if (type === 'Array') {
        return formatList(data, options);
      } else if (type === 'Set') {
        return formatSet(data, options);
      } else if (type === 'String') {
        if (data.length === 0 && options.convertEmptyValues) {
          return Converter.input(null);
        }
        return { S: data };
      } else if (type === 'Number' || type === 'NumberValue') {
        return { N: data.toString() };
      } else if (type === 'Binary') {
        if (data.length === 0 && options.convertEmptyValues) {
          return Converter.input(null);
        }
        return { B: data };
      } else if (type === 'Boolean') {
        return { BOOL: data };
      } else if (type === 'null') {
        return { NULL: true };
      } else if (type !== 'undefined' && type !== 'Function') {
        // this value has a custom constructor
        return formatMap(data, options);
      }
    }

    /**
     * Convert a JavaScript object into a DynamoDB record.
     *
     * @param data [any] The data to convert to a DynamoDB record
     * @param options [map]
     * @option options convertEmptyValues [Boolean] Whether to automatically
     *                                              convert empty strings, blobs,
     *                                              and sets to `null`
     * @option options wrapNumbers [Boolean]  Whether to return numbers as a
     *                                        NumberValue object instead of
     *                                        converting them to native JavaScript
     *                                        numbers. This allows for the safe
     *                                        round-trip transport of numbers of
     *                                        arbitrary size.
     *
     * @return [map] An object in the DynamoDB record format.
     *
     * @example Convert a JavaScript object into a DynamoDB record
     *  var marshalled = AWS.DynamoDB.Converter.marshall({
     *    string: 'foo',
     *    list: ['fizz', 'buzz', 'pop'],
     *    map: {
     *      nestedMap: {
     *        key: 'value',
     *      }
     *    },
     *    number: 123,
     *    nullValue: null,
     *    boolValue: true,
     *    stringSet: new DynamoDBSet(['foo', 'bar', 'baz'])
     *  });
     */
    static marshall( data: Document, options?: Document ): Document {
      return Converter.input(data, options).M;
    }

    /**
     * Convert a DynamoDB AttributeValue object to its equivalent JavaScript type.
     *
     * @param data [map] An object in the Amazon DynamoDB AttributeValue format
     * @param options [map]
     * @option options convertEmptyValues [Boolean] Whether to automatically
     *                                              convert empty strings, blobs,
     *                                              and sets to `null`
     * @option options wrapNumbers [Boolean]  Whether to return numbers as a
     *                                        NumberValue object instead of
     *                                        converting them to native JavaScript
     *                                        numbers. This allows for the safe
     *                                        round-trip transport of numbers of
     *                                        arbitrary size.
     *
     * @return [Object|Array|String|Number|Boolean|null]
     *
     * @see AWS.DynamoDB.Converter.unmarshall AWS.DynamoDB.Converter.unmarshall to
     *    convert entire records (rather than individual attributes)
     */
    static output( data: Document, options: Document = {} ): any {
      let list: any[]
      let map: Document
      let i: number;

      for (var type in data) {
        var values = data[type];
        if (type === 'M') {
          map = {};
          for (var key in values) {
            map[key] = Converter.output(values[key], options);
          }
          return map;
        } else if (type === 'L') {
          list = [];
          for (i = 0; i < values.length; i++) {
            list.push(Converter.output(values[i], options));
          }
          return list;
        } else if (type === 'SS') {
          list = [];
          for (i = 0; i < values.length; i++) {
            list.push(values[i] + '');
          }
          return new DynamoDBSet(list);
        } else if (type === 'NS') {
          list = [];
          for (i = 0; i < values.length; i++) {
            list.push(convertNumber(values[i], options.wrapNumbers));
          }
          return new DynamoDBSet(list);
        } else if (type === 'BS') {
          list = [];
          for (i = 0; i < values.length; i++) {
            list.push(base64ToUint8Array(values[i]));
          }
          return new DynamoDBSet(list);
        } else if (type === 'S') {
          return values + '';
        } else if (type === 'N') {
          return convertNumber(values, options.wrapNumbers);
        } else if (type === 'B') {
          return base64ToUint8Array(values);
        } else if (type === 'BOOL') {
          return (values === 'true' || values === 'TRUE' || values === true);
        } else if (type === 'NULL') {
          return null;
        }
      }
    }

    /**
     * Convert a DynamoDB record into a JavaScript object.
     *
     * @param data [any] The DynamoDB record
     * @param options [map]
     * @option options convertEmptyValues [Boolean] Whether to automatically
     *                                              convert empty strings, blobs,
     *                                              and sets to `null`
     * @option options wrapNumbers [Boolean]  Whether to return numbers as a
     *                                        NumberValue object instead of
     *                                        converting them to native JavaScript
     *                                        numbers. This allows for the safe
     *                                        round-trip transport of numbers of
     *                                        arbitrary size.
     *
     * @return [map] An object whose properties have been converted from
     *    DynamoDB's AttributeValue format into their corresponding native
     *    JavaScript types.
     *
     * @example Convert a record received from a DynamoDB stream
     *  var unmarshalled = AWS.DynamoDB.Converter.unmarshall({
     *    string: {S: 'foo'},
     *    list: {L: [{S: 'fizz'}, {S: 'buzz'}, {S: 'pop'}]},
     *    map: {
     *      M: {
     *        nestedMap: {
     *          M: {
     *            key: {S: 'value'}
     *          }
     *        }
     *      }
     *    },
     *    number: {N: '123'},
     *    nullValue: {NULL: true},
     *    boolValue: {BOOL: true}
     *  });
     */
    static unmarshall( data: Document, options?: Document ): Document {
     return Converter.output({M: data}, options);
    };
}
