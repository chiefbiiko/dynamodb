import { Document} from "./types.ts"

/** noop. */
export function noop(...args: any[]): void {}

/** Defines a property. */
export function property(obj:any, name:string, value:any, enumerable?:boolean, isValue?:boolean):void {
  const opts: Document = {
    configurable: true,
    enumerable: typeof enumerable === "boolean" ? enumerable : true
  };

  if (typeof value === 'function' && !isValue) {
    opts.get = value;
  } else {
    opts.value = value;
    opts.writable = true;
  }

  Object.defineProperty(obj, name, opts);
}

/** Defines a memoized property. */
export function memoizedProperty(obj: any, name: string, get: () => any, enumerable?:boolean):void {
  let cachedValue:any = null;

  // build enumerable attribute for each value with lazy accessor.
  property(obj, name, ():void => {
    if (cachedValue === null) {
      cachedValue = get();
    }

    return cachedValue;
  }, enumerable);
}

/** Date format helpers. */
export const date: Document = {
  from(date: number | string | Date): Date {
  if (typeof date === 'number') {
    return new Date(date * 1000); // unix timestamp
  } else {
    return new Date(date as any);
  }
},
iso8601(date: Date = new Date()):string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
},
rfc822(date: Date = new Date()): string {
  return date.toUTCString();
},
unixTimestamp(date: Date = new Date()): number {
  return date.getTime() / 1000;
},
/** Valid formats are: iso8601, rfc822, unixTimestamp. */
format(date: Date, formatter: string = 'iso8601'): number | string {
  return this[formatter](this.from(date));
},
parseTimestamp(value: number | string): Date {
   if (typeof value === 'number') { // unix timestamp (number)
     return new Date(value * 1000);
   } else if (value.match(/^\d+$/)) { // unix timestamp
     return new Date(Number(value) * 1000);
   } else if (value.match(/^\d{4}/)) { // iso8601
     return new Date(value);
   } else if (value.match(/^\w{3},/)) { // rfc822
     return new Date(value);
   } else {
     throw new Error(`unhandled timestamp format: ${value}`);
   }
 }
}

/** String helpers. */
export const string: Document = {
  lowerFirst(s: string): string {
    return `${s[0].toLowerCase()}${s.substr(1)}`
  }
}
