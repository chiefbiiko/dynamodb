import { Document, property }from "./../util.ts"

const WAITER_KEYS:string[] =   [ 'type', 'description', 'delay', 'maxAttempts', 'acceptors'
  ]

export function ResourceWaiter(name: string, waiter: Document, options: Document= {}) {
    const self: any = this;

  property(this, 'name', name);
  property(this, 'api', options.api, false);

  if (waiter.operation) {
    property(this, 'operation', waiter.operation);
  }


WAITER_KEYS.forEach((key: string): void => {
    const value: any = waiter[key];

    if (value) {
      property(self, key, value);
    }
  });
}
