import { OPS, NO_PARAMS_OPS } from "./mod.ts"

const readTheOps: string = Array.from(OPS).map((op:string, i: number): string => {
  const params: string = NO_PARAMS_OPS.has(op) ? "" : "params: Document, "
  const rtn: string = `Promise<${op === "Scan" || op === "Query" ? "Document | AsyncIterableIterator<Document>" : "Document"}>` 
  const camel: string = `${op[0].toLowerCase()}${op.slice(1)}`
  return `#### \`${camel}(${params}options?: OpOptions): ${rtn}\`\n\n` + 
    `[aws ${op} docs](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_${op}.html)${i === OPS.size - 1 ? "" : "\n\n"}`
}).join("")

const README0: string = new TextDecoder().decode(Deno.readFileSync("./README0.md"))

const readTheDocs: string = README0.replace("<OPS/>", readTheOps)

console.log(readTheDocs)