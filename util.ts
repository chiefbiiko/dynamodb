const ANY_BUT_DIGITS: RegExp = /[^\d]/g;
const ANY_BUT_DIGITS_T: RegExp = /[^\dT]/g;

/** Generic document. */
export interface Doc {
  [key: string]: any;
}

/** noop. */
export function noop(..._: any[]): void {}

/** camelCase */
export function camelCase(text: string): string {
  return `${text[0].toLowerCase()}${text.slice(1)}`;
}

/** Defines a property. */
export function property(
  obj: any,
  name: string,
  value: any,
  enumerable?: boolean,
  isValue?: boolean
): void {
  const opts: Doc = {
    configurable: true,
    enumerable: typeof enumerable === "boolean" ? enumerable : true
  };

  if (typeof value === "function" && !isValue) {
    opts.get = value;
  } else {
    opts.value = value;
    opts.writable = true;
  }

  Object.defineProperty(obj, name, opts);
}

/** Defines a memoized property. */
export function memoizedProperty(
  obj: any,
  name: string,
  get: () => any,
  enumerable?: boolean
): void {
  let cachedValue: any = null;

  // build enumerable attribute for each value with lazy accessor.
  property(
    obj,
    name,
    (): void => {
      if (cachedValue === null) {
        cachedValue = get();
      }

      return cachedValue;
    },
    enumerable
  );
}

/** aws typeof impl. */
export function typeOf(data: any): string {
  if (data === null && typeof data === "object") {
    return "null";
  } else if (data !== undefined && isBinary(data)) {
    return "Binary";
  } else if (data !== undefined && data.constructor) {
    return data.wrapperName || data.constructor.name;
  } else if (data !== undefined && typeof data === "object") {
    // this object is the result of Object.create(null), hence the absence of a
    // defined constructor
    return "Object";
  } else {
    return "undefined";
  }
}

/** Is given value a binary type? */
function isBinary(data: any): boolean {
  const types: string[] = [
    "Buffer",
    "File",
    "Blob",
    "ArrayBuffer",
    "DataView",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array"
  ];

  // if (util.isNode()) {
  //   var Stream = util.stream.Stream;
  //   if (util.Buffer.isBuffer(data) || data instanceof Stream) {
  //     return true;
  //   }
  // }

  // var isType = (obj, type) => Object.prototype.toString.call(obj) === '[object ' + type + ']';

  if (data !== undefined && data.constructor) {
    // console.error(">>>>>>>>>> isBinary data", data)
    //  for (let i: number = 0; i < types.length; i++) {
    //
    //   // if (util.isType(data, types[i])) return true;
    //   if (data.constructor.name === types[i]) {
    //     // console.error(">>>> isBinary TRUE", data)
    //     return true;
    //   }
    //   // if(isType(data, types[i])) {
    //   //   return true
    //   // }
    //
    // }
    return types.some(
      (type: string): boolean => data.constructor.name === type
    );
  }

  return false;
}

/** Mapping member to set type. */
const memberTypeToSetType: Doc = {
  String: "String",
  Number: "Number",
  NumberValue: "Number",
  Binary: "Binary"
};

/** DynamoDB set type. */
export class DynamoDBSet {
  readonly wrappername: string = "Set";
  readonly values: any[] = [];
  readonly type: string = "";

  /** Creates a dynamodb set. */
  constructor(list: any[] = [], options: Doc = {}) {
    Array.prototype.push.apply(this.values, list);

    this.type = memberTypeToSetType[typeOf(this.values[0])];

    if (!this.type) {
      throw new Error(
        "DynamoDB sets can only contain string, number, or binary values"
      );
    }

    if (options.validate) {
      for (const value of this.values) {
        if (memberTypeToSetType[typeOf(value)] !== this.type) {
          throw new Error(`${this.type} Set contains ${typeOf(value)} value`);
        }
      }
    }
  }

  /** Renders the underlying values only when converting to JSON. */
  toJSON(): any[] {
    return this.values;
  }
}

/**
 * An object recognizable as a numeric value that stores the underlying number
 * as a string.
 *
 * Intended to be a deserialization target for the DynamoDB Doc Client when
 * the `wrapNumbers` flag is set. This allows for numeric values that lose
 * precision when converted to JavaScript's `number` type.
 */
export class DynamoDBNumberValue {
  readonly wrapperName: string = "NumberValue";
  readonly value: string;

  /** Creates a dynamodb number value. */
  constructor(value: number | string) {
    this.value = value.toString();
  }

  /** Renders the underlying value as a number when converting to JSON. */
  toJSON(): number {
    return this.toNumber();
  }

  /** Converts the underlying value to a JavaScript number. */
  toNumber(): number {
    return Number(this.value);
  }

  /** Returns a decimal string representing the number value. */
  toString(): string {
    return this.value;
  }
}

/** Date format helpers. */
export const date: Doc = {
  /** Date stamp format as expected by awsSignatureV4KDF. */
  DATE_STAMP_REGEX: /^\d{8}$/,
  amz(date: Date): string {
    return `${date
      .toISOString()
      .slice(0, 19)
      .replace(ANY_BUT_DIGITS_T, "")}Z`;
  },
  dateStamp(date: Date): string {
    return date
      .toISOString()
      .slice(0, 10)
      .replace(ANY_BUT_DIGITS, "");
  },
  from(date: number | string | Date): Date {
    if (typeof date === "number") {
      return new Date(date * 1000); // unix timestamp
    } else {
      return new Date(date as any);
    }
  },
  iso8601(date: Date = new Date()): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  },
  rfc822(date: Date = new Date()): string {
    return date.toUTCString();
  },
  unixTimestamp(date: Date = new Date()): number {
    return date.getTime() / 1000;
  },
  /** Valid formats are: iso8601, rfc822, unixTimestamp, dateStamp, amz. */
  format(date: Date, formatter: string = "iso8601"): number | string {
    return this[formatter](this.from(date));
  },
  parseTimestamp(value: number | string): Date {
    if (typeof value === "number") {
      // unix timestamp (number)
      return new Date(value * 1000);
    } else if (value.match(/^\d+$/)) {
      // unix timestamp
      return new Date(Number(value) * 1000);
    } else if (value.match(/^\d{4}/)) {
      // iso8601
      return new Date(value);
    } else if (value.match(/^\w{3},/)) {
      // rfc822
      return new Date(value);
    } else {
      throw new Error(`unhandled timestamp format: ${value}`);
    }
  }
};
