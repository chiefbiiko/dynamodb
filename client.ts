import { createHeaders} from "./headers.ts"

/** Generic representation of a DynamoDB client. */
export interface DynamoDBClient {
  // whats the resolve type?
  put(key: any, value: any): Promise<any>
  get(key: any): Promise<any>
}

/** Client configuration- */
export interface ClientConfig {
  accessKeyId: string // AKIAIOSFODNN7EXAMPLE
  secretAccessKey: string // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: string // us-west-2
  canonicalUri?: string // fx /path/to/somewhere
}

/** Creates a DynamoDB client. */
export function createClient(conf: ClientConfig): DynamoDBClient {
  return {
    async put(key: any, value: any): Promise<any> {
      const payload: Uint8Array = createPayload(/** make params to json string */)
      const headers: Headers = createHeaders({ ...conf, method: "PUT", op: "PutItem", 
    payload
    })
    // fetch send request
    },
    async get() {
      
    }
  }
}