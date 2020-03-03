// var util = require('../core').util;
// var convert = require('./converter');
import { Doc } from "../util.ts";
import { Converter } from "./converter.ts";

export function Translator(
  this: any,
  {
  wrapNumbers,
  convertEmptyValues,
  attrValue
}: Doc = {}) {
  // options = options || {};
  this.attrValue = attrValue;
  this.convertEmptyValues = Boolean(convertEmptyValues);
  this.wrapNumbers = Boolean(wrapNumbers);
}

Translator.prototype.translateInput = function(value: any, shape: any): any {
  this.mode = "input";
  return this.translate(value, shape);
};

Translator.prototype.translateOutput = function(value: any, shape: any): any {
  this.mode = "output";
  return this.translate(value, shape);
};

Translator.prototype.translate = function(value: any, shape: any): any {
  const self: any = this;

  if (!shape || value === undefined) {
    return undefined;
  }

  if (shape.shape === self.attrValue) {
    return (Converter as any)[self.mode](value, {
      convertEmptyValues: self.convertEmptyValues,
      wrapNumbers: self.wrapNumbers
    });
  }

  switch (shape.type) {
    case "structure":
      return self.translateStructure(value, shape);
    case "map":
      return self.translateMap(value, shape);
    case "list":
      return self.translateList(value, shape);
    default:
      return self.translateScalar(value, shape);
  }
};

Translator.prototype.translateStructure = function(
  structure: any,
  shape: any
): undefined|Doc {
  const self: any = this;

  if (structure == null) {
    return undefined;
  }

  const struct: Doc = {};
  // util.each(structure, function(name, value) {
  Object.entries(structure).forEach(([name, value]: [string, any]): void => {
    const memberShape: any = shape.members[name];

    if (memberShape) {
      const result: any = self.translate(value, memberShape);

      if (result !== undefined) {
        struct[name] = result;
      }
    }
  });

  return struct;
};

Translator.prototype.translateList = function(list: any[], shape: any): undefined | any[] {
  const self: any = this;

  if (list == null) {
    return undefined;
  }

  return list.map((value: any): any => {
    const result: any = self.translate(value, shape.member);

    if (result === undefined) {
      return null;
    } else {
      return result;
    }
  });

  // var out = [];
  // // util.arrayEach(list, function(value) {
  // list.forEach(function(value) {
  //   var result = self.translate(value, shape.member);
  //   if (result === undefined) out.push(null);
  //   else out.push(result);
  // });
  // return out;
};

Translator.prototype.translateMap = function(map: Doc |undefined|null, shape: any): undefined | Doc {
  const self: any = this;

  if (!map) {
    return undefined;
  }

  return Object.entries(map).reduce(
    (acc: Doc, [key, value]: [string, any]): Doc => {
      const result: any = self.translate(value, shape.value);

      if (result === undefined) {
        acc[key] = null;
      } else {
        acc[key] = result;
      }

      return acc;
    },
    {}
  );

  // var out = {};
  // // util.each(map, function(key, value) {
  // Object.entries(map).forEach(function([key, value]) {
  //   var result = self.translate(value, shape.value);
  //   if (result === undefined) out[key] = null;
  //   else out[key] = result;
  // });
  // return out;
};

Translator.prototype.translateScalar = function(value: any, shape: any): any {
  return shape.toType(value);
};
