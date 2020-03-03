// var Shape = require('./shape');
import { Shape } from "./shape.ts";
// var util = require('../util');
// var property = util.property;
// var memoizedProperty = util.memoizedProperty;
import { Doc, memoizedProperty, property } from "../util.ts";
// import { Doc} from "../types.ts"

export function Operation(this: any, name: string, operation: Doc, options: Doc = {}) {
  const self: any = this;
  // options = options || {};

  property(this, "name", operation.name || name);
  property(this, "api", options.api, false);

  operation.http = operation.http || {};

  property(this, "endpoint", operation.endpoint);
  property(this, "httpMethod", operation.http.method || "POST");
  property(this, "httpPath", operation.http.requestUri || "/");
  property(this, "authtype", operation.authtype || "");
  property(
    this,
    "endpointDiscoveryRequired",
    operation.endpointdiscovery
      ? operation.endpointdiscovery.required
        ? "REQUIRED"
        : "OPTIONAL"
      : "NULL"
  );

  memoizedProperty(this, "input", function(): any {
    if (!operation.input) {
      return /*new*/ Shape.create({ type: "structure" }, options);
    }

    return Shape.create(operation.input, options);
  });

  memoizedProperty(this, "output", function(): any {
    if (!operation.output) {
      return /*new*/ Shape.create({ type: "structure" }, options);
    }

    return Shape.create(operation.output, options);
  });

  memoizedProperty(this, "errors", function(): any[] {
    if (!operation.errors) {
      return [];
    }

    return operation.errors.map((error: any): any =>
      Shape.create(error, options)
    );

    // const list: any[] = [];
    //
    // for (let i: number = 0; i < operation.errors.length; i++) {
    //   list.push(Shape.create(operation.errors[i], options));
    // }
    //
    // return list;
  });

  memoizedProperty(this, "paginator", function(): any {
    return options.api.paginators[name];
  });

  if (options.documentation) {
    property(this, "documentation", operation.documentation);
    property(this, "documentationUrl", operation.documentationUrl);
  }

  // idempotentMembers only tracks top-level input shapes
  memoizedProperty(this, "idempotentMembers", function(): string[] {
    // const idempotentMembers: string[] = [];
    // const input: Doc = self.input;
    // const members: Doc = input.members;

    if (!self.input.members) {
      return []; //idempotentMembers;
    }

    return Object.entries(self.input.members)
      .filter(([_, value]: [string, any]): boolean => value.isIdempotent)
      .map(([key, _]: [string, any]): string => key);

    // for (const name in members) {
    //   if (!members.hasOwnProperty(name)) {
    //     continue;
    //   }
    //
    //   if (members[name].isIdempotent) {
    //     idempotentMembers.push(name);
    //   }
    // }
    //
    // return idempotentMembers;
  });

  memoizedProperty(this, "hasEventOutput", function(): boolean {
    // var output = self.output;
    return hasEventStream(self.output);
  });
}

function hasEventStream(topLevelShape: Doc): boolean {
  const members: Doc = topLevelShape.members;
  const payload: string = topLevelShape.payload;

  if (!topLevelShape.members) {
    return false;
  }

  if (payload) {
    const payloadMember: Doc = members[payload];
    return payloadMember.isEventStream;
  }

  // check if any member is an event stream
  for (const name in members) {
    if (!members.hasOwnProperty(name) && members[name].isEventStream) {
      // if (members[name].isEventStream === true) {
      //   return true;
      // }
      return true;
    }
  }

  return false;
}

// /**
//  * @api private
//  */
// module.exports = Operation;
