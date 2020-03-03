// var memoizedProperty = require('../util').memoizedProperty;
// import { Doc} from "../types.ts"
import { Doc, memoizedProperty, noop } from "../util.ts";

function memoize(
  this: any,
  name: string,
  value: any,
  factory: (
    name: string,
    value: any
  ) => any /*, nameTr: (name:string)=> string*/
): void {
  memoizedProperty(this, name /*nameTr(name)*/, function(): any {
    return factory(name, value);
  });
}

export function Collection(
  this: any, 
  iterable: any,
  options: Doc,
  factory: (
    name: string,
    value: any
  ) => any /*, nameTr: (name:string)=> string = String*/,
  callback: (name: string, value: any) => any = noop
) {
  // nameTr = nameTr || String;
  // var self = this;

  for (const id in iterable) {
    if (Object.prototype.hasOwnProperty.call(iterable, id)) {
      memoize.call(this, id, iterable[id], factory /*, nameTr*/);

      if (callback) {
        callback(id, iterable[id]);
      }
    }
  }
}

// export class Collection {
//
//   constructor(iterable: any, options: Doc, factory:(name: string, value: any)=> any/*, nameTr: (name:string)=> string = String*/, callback: (name: string, value: any) => any=noop) {
//     // nameTr = nameTr || String;
//     // var self = this;
//
//     for (const id in iterable) {
//       if (Object.prototype.hasOwnProperty.call(iterable, id)) {
//         memoize.call(this, id, iterable[id], factory/*, nameTr*/);
//
//         if (callback) {callback(id, iterable[id]);}
//       }
//     }
//   }
// }
// // /**
//  * @api private
//  */
// module.exports = Collection;
