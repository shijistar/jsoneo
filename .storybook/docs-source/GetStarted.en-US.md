# Quick Start

```ts
import { parse, stringify } from 'jsoneo';

const json = {
  // JSON primitives
  name: 'John',
  age: 30,
  isAdmin: false,
  address: { city: 'New York', zip: '10001' },
  tags: ['developer', 'javascript'],

  // Special primitive values
  negativeZero: -0,
  notANumber: NaN,
  positiveInfinity: Infinity,
  negativeInfinity: -Infinity,
  bigValue: 12345678901234567890n,

  // Built-in objects
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  invalidDate: new Date(NaN),
  pattern: /abc/gi,
  error: new Error('boom'),
  homepage: new URL('https://example.com?id=123'),
  query: new URLSearchParams('id=123&tab=profile'),

  // Symbol values and object keys
  id: Symbol.for('id'),
  wellKnownSymbol: Symbol.iterator,
  localSymbol: Symbol('localId'),
  [Symbol.for('role')]: 'admin',
  [Symbol.toStringTag]: 'User',

  // Collections
  roles: new Map([
    ['admin', true],
    ['editor', false],
  ]),
  permissions: new Set(['read', 'write']),

  // Binary data
  bytes: new Uint8Array([1, 2, 3, 4]),
  typedArrays: {
    int8: new Int8Array([-1, 2]),
    int16: new Int16Array([-1234, 2345]),
    int32: new Int32Array([-123456, 234567]),
    float32: new Float32Array([1.5, -2.25]),
    float64: new Float64Array([Math.PI, -Math.E]),
    bigInt64: new BigInt64Array([-1n, 2n]),
  },
  buffer: new ArrayBuffer(8),
  view: new DataView(new ArrayBuffer(8)),

  // Functions
  welcome() {
    return `Hi! ${this.name}!`;
  },
  loadProfile: async function () {
    return { name: this.name, status: 'loaded' };
  },
  add: (a: number, b: number) => a + b,
  *numbers() {
    yield 1;
    yield 2;
  },
  iterable: {
    *[Symbol.iterator]() {
      yield 'a';
      yield 'b';
    },
  },
};

// Property descriptors
Object.defineProperties(json, {
  birthday: { value: '2000-01-01', writable: false, enumerable: true },
  _value: { value: 1, writable: true, enumerable: false },
  publicValue: {
    get() {
      return this._value;
    },
    set(value) {
      this._value = value;
    },
    enumerable: true,
  },
});

// Circular references
json.self = json;

// Serialize
const serialized = stringify(json);
console.log('Serialized:', serialized);

// Deserialize
const deserialized = parse(serialized);
console.log('Deserialized:', deserialized);
```

## Expected Results

After running the above code:

- `deserialized.createdAt` will be a `Date` instance
- `deserialized.roles` will be a `Map` instance
- `deserialized.permissions` will be a `Set` instance
- `deserialized.bytes` will be a `Uint8Array` instance
- `deserialized.welcome()` will work as a function
- `deserialized.self === deserialized` will be `true` (circular reference restored)
- Property descriptors like `birthday` (read-only) and `publicValue` (accessor) are preserved
