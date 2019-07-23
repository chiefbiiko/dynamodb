/*
Object.defineProperty(apiLoader.services['dynamodb'], '2012-08-10', {
  get: function get() {
    var model = require('../apis/dynamodb-2012-08-10.min.json');
    model.paginators = require('../apis/dynamodb-2012-08-10.paginators.json').pagination;
    model.waiters = require('../apis/dynamodb-2012-08-10.waiters2.json').waiters;
    return model;
  },
  enumerable: true,
  configurable: true
});
*/
import {resolve} from "https://deno.land/std/fs/path/mod.ts"
import { Document} from "./../util.ts"
import  { Api } from "./api.ts"

const spec: Document = JSON.parse(new TextDecoder().decode(Deno.readFileSync(resolve("dynamodb-2012-08-10.min.json"))))

export const API: any = new Api(spec);
