/** Generic document. */
export interface Document {
  [key: string]: any;
}

/** aws typeof impl. */
export function typeOf(data: any): string {
  if (data === null && typeof data === 'object') {
    return 'null';
  } else if (data !== undefined && isBinary(data)) {
    return 'Binary';
  } else if (data !== undefined && data.constructor) {
    return data.wrapperName || data.constructor.name;
  } else if (data !== undefined && typeof data === 'object') {
    // this object is the result of Object.create(null), hence the absence of a
    // defined constructor
    return 'Object';
  } else {
    return 'undefined';
  }
}

/** Is given value a binary type? */
function isBinary(data: any): boolean {
  const types : string[]= [
    'Buffer', 'File', 'Blob', 'ArrayBuffer', 'DataView',
    'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
    'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
    'Float32Array', 'Float64Array'
  ];
  
  // if (util.isNode()) {
  //   var Stream = util.stream.Stream;
  //   if (util.Buffer.isBuffer(data) || data instanceof Stream) {
  //     return true;
  //   }
  // }

  for (var i = 0; i < types.length; i++) {
    if (data !== undefined && data.constructor) {
      // if (util.isType(data, types[i])) return true;
      if (data.constructor.name === types[i]) {return true;}
    }
  }

  return false;
}

/** Mapping member to set type. */
const memberTypeToSetType: Document = {
  String: 'String',
  Number: 'Number',
  NumberValue: 'Number',
  Binary: 'Binary'
};

/** DynamoDB set type. */
export class DynamoDBSet {
  readonly wrappername: string = "Set";
  readonly values: any[]
  readonly type: string;
  
  /** Creates a dynamodb set. */
  constructor(list: any[]=[], options: Document={}) {
    this.values = [].concat(list);
    
    this.type = memberTypeToSetType[typeOf(this.values[0])];
    
    if (!this.type) {
      throw new Error("DynamoDB sets can only contain string, number, or binary values")
    }
    
    if (options.validate) {
      for (const value of this.values) {
        if (memberTypeToSetType[typeOf(value)] !== this.type) {
          throw new Error(`${this.type} Set contains ${typeOf(value)} value`)
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
 * Intended to be a deserialization target for the DynamoDB Document Client when
 * the `wrapNumbers` flag is set. This allows for numeric values that lose
 * precision when converted to JavaScript's `number` type.
 */
export class DynamoDBNumberValue {
  readonly wrapperName: string = "NumberValue"
  readonly value: string;
  
  /** Creates a dynamodb number value. */
  constructor(value: number |string) {
    this.value = value.toString();
  }

  /** Renders the underlying value as a number when converting to JSON. */
  toJSON (): number {
    return this.toNumber();
  }

  /** Converts the underlying value to a JavaScript number. */
  toNumber (): number {
    return Number(this.value);
  }

  /** Returns a decimal string representing the number value. */
  toString(): string {
    return this.value;
  }
}

