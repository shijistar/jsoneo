# jsoneo

[![npm latest version](https://img.shields.io/npm/v/jsoneo.svg?cacheSeconds=86400)](https://www.npmjs.com/package/jsoneo)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/shijistar/jsoneo)
![GitHub License](https://img.shields.io/github/license/shijistar/jsoneo?label=License&color=ff8000&cacheSeconds=86400)

**English** | [简体中文](./README.zh-CN.md)

> JSON, upgraded for real JavaScript objects.

`jsoneo` is a JSON enhancement library for serializing and deserializing complex JavaScript values that native `JSON.stringify()` and `JSON.parse()` cannot represent well: `Date`, `RegExp`, `BigInt`, `Symbol`, functions, `Map`, `Set`, typed arrays, property descriptors, prototype members, circular references, and more.

It is especially useful when you need to move rich test fixtures or object graphs between Node.js, browsers, and end-to-end test environments.

> Write once, run in multiple environments.

## Why jsoneo?

Native JSON is simple and portable, but it loses JavaScript-specific information:

- `Date` becomes a string.
- `Map`, `Set`, `RegExp`, `BigInt`, `Symbol`, typed arrays, and functions are not faithfully preserved.
- `undefined`, `NaN`, `Infinity`, `-Infinity`, and `-0` need special handling.
- non-enumerable properties, accessors, property descriptors, and prototype methods are dropped.
- circular references throw errors.

`jsoneo` keeps the familiar `stringify` / `parse` workflow while preserving much more of the original JavaScript value.

## Installation

```bash
npm install jsoneo
```

## Quick start

```ts
import { parse, stringify } from 'jsoneo';

const json = {
  name: 'John',
  age: 30,
  isAdmin: false,
  address: { city: 'New York', zip: '10001' },
  tags: ['developer', 'javascript'],
  projects: [{ id: 1, name: 'Project 1' }],

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
    return `Hi! ${this.name}`;
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

// Serialization
const serialized = stringify(json); // [a long string]
// Deserialization
const deserialized = parse(serialized);
```

## Supported data

### JSON-compatible values

- `string`
- `number`
- `boolean`
- `null`
- plain objects
- arrays

### JavaScript-specific values

- `undefined` in objects, following JSON semantics
- `NaN`
- `Infinity`
- `-Infinity`
- `-0`
- `BigInt`
- `Date`
- `RegExp`
- `Symbol`
  - well-known symbols, such as `Symbol.iterator`
  - global symbols created with `Symbol.for()`
  - local symbols with descriptions as values
  - symbol object keys are best supported when they are well-known symbols or created with `Symbol.for()`
- functions
  - regular functions
  - arrow functions
  - async functions
  - generator functions
  - class methods
  - function properties
- `Map`
- `Set`
- `WeakMap` structure only, without entries
- `WeakSet` structure only, without entries
- `URL`
- `URLSearchParams`
- typed arrays
  - `Int8Array`
  - `Uint8Array`
  - `Uint8ClampedArray`
  - `Int16Array`
  - `Uint16Array`
  - `Int32Array`
  - `Uint32Array`
  - `Float32Array`
  - `Float64Array`
  - `BigInt64Array`
  - `BigUint64Array`
- `ArrayBuffer`
- `DataView`
- Node.js `Buffer`
- `Error`
- iterable objects
- circular references
- prototype methods and properties
- custom property descriptors
- non-enumerable properties
- getter and setter descriptors
- `JSON.rawJSON()` objects when supported by the runtime
- `toJSON` / `fromJSON` custom function on object

> Almost everything in JavaScript!

## API

### `stringify(value, options?)`

Serializes a JavaScript value into a string.

```ts
import { stringify } from 'jsoneo';

const text = stringify(value, options);
```

#### `StringifyOptions`

| Option                     | Type      | Default    | Description                                                      |
| -------------------------- | --------- | ---------- | ---------------------------------------------------------------- |
| `startTag`                 | `string`  | `'$SJS$_'` | Internal marker used to encode JavaScript expressions.           |
| `endTag`                   | `string`  | `'_$SJE$'` | Internal marker used to encode JavaScript expressions.           |
| `variablePrefix`           | `string`  | `'$SJV$_'` | Prefix used for generated variable names.                        |
| `preserveClassConstructor` | `boolean` | `true`     | Whether to preserve class constructor code during serialization. |
| `preserveDescriptors`      | `boolean` | `true`     | Whether to preserve custom property descriptors.                 |
| `debug`                    | `boolean` | `false`    | Print serialization debug information.                           |

### `parse(input, options?)`

Deserializes a string produced by `stringify`.

```ts
import { parse } from 'jsoneo';

const value = parse(text, options);
```

#### `ParseOptions`

| Option        | Type                      | Default              | Description                                                            |
| ------------- | ------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `closure`     | `Record<string, unknown>` | `undefined`          | External variables made available when restoring serialized functions. |
| `get`         | `GetFunc`                 | built-in path getter | Custom function used to read child values while restoring patches.     |
| `prettyPrint` | `boolean`                 | `true`               | Pretty-print generated deserialization code in debug output.           |
| `debug`       | `boolean`                 | `false`              | Print deserialization debug information.                               |

### Using /closure/ for functions

Function bodies can be serialized, but JavaScript closures cannot be captured automatically. If a restored function needs external values, provide them through the `closure` option of `parse(text, options)`, or attach them directly to a named function object.

```ts
import { parse, stringify } from 'jsoneo';

const allowedRoles = ['admin', 'editor'];
const source = {
  canRead(user: { role: string }) {
    return allowedRoles.includes(user.role);
  },
};

const restored = parse(stringify(source), {
  // The function body references `allowedRoles`, so provide it explicitly.
  closure: {
    allowedRoles,
  },
});

restored.canRead({ role: 'admin' }); // true
```

Alternatively, attach serializable values directly to a named function object, then read them inside the function through `functionName.xxx`. Because functions are objects, `jsoneo` can preserve those properties together with the function.

```ts
import { parse, stringify } from 'jsoneo';

function canRead(user: { role: string }) {
  return canRead.allowedRoles.includes(user.role);
}
canRead.allowedRoles = ['admin', 'editor'];

const restored = parse(stringify({ canRead })) as { canRead: typeof canRead };

restored.canRead({ role: 'admin' }); // true
restored.canRead.allowedRoles; // ['admin', 'editor']
```

Use a named function for this pattern. Anonymous functions, arrow functions, or object method shorthand do not provide the same reliable self-reference for `functionName.xxx` inside the function body.

## Important notes and limitations

- `parse` should only be used with strings produced by `stringify` and from trusted sources.
- Function source code can be serialized, but closures are not captured automatically. Use the `closure` option of `parse(text, options)` for external values, or attach serializable values to a named function object and access them through `functionName.xxx`.
- Native functions are dropped during serialization because their source is reported as `[native code]` and cannot be reconstructed.
- Avoid `Function.prototype.bind()`: bound functions are native-like and cannot be reconstructed reliably.
- Private class fields and private methods are not accessible from outside the object and are not suitable serialization targets.
- `Map` values are supported, but non-string keys are all converted to strings, just like `object`, in the current implementation.
- In browsers, Node.js `Buffer` values are restored as `Uint8Array` when `Buffer` is unavailable.
- `WeakMap` and `WeakSet` entries are not enumerable, so only their structure (`{}` or `[]`) can be represented.

## Security

`jsoneo` can restore functions, accessors, descriptors, and prototype-related data. During `parse`, it generates and evaluates JavaScript code to rebuild the original value.

For that reason:

- only parse data produced by `jsoneo.stringify()`;
- only parse data from trusted sources;
- never pass arbitrary user input, untrusted network data, or unreviewed third-party payloads to `parse`;
- do not treat `jsoneo` as a sandbox or a security boundary.

If you need to exchange untrusted data, use native JSON or another data-only format instead.

## Browser and Node.js compatibility

`jsoneo` is designed for both Node.js and browser environments. It automatically handles environment-specific values where possible, such as converting Node.js `Buffer` values to `Uint8Array` in browsers.

The package currently declares support for Node.js `>=12`. Features such as `BigInt` and BigInt typed arrays still require runtimes that support them.

## Common use cases

- Sharing one fixture between unit tests and e2e tests.
- Moving complex objects between Node.js and browser test runners.
- Snapshotting complex JavaScript values for debugging.
- Preserving object graphs that include functions, symbols, maps, sets, typed arrays, descriptors, and circular references.
- Reusing test suites across multiple runtime environments.

This project was extracted from [enum-plus](https://github.com/shijistar/enum-plus), where it was used to serialize `Enum` objects from browser tests back to Node.js so the same Jest test suites could be reused in Playwright e2e tests. It was previously named [serialize-everything.js](https://github.com/shijistar/serialize-everything.js).

## FAQ

### Is jsoneo a drop-in replacement for JSON?

Not exactly. It uses a familiar `stringify` / `parse` API, but it is intended for trusted JavaScript object round trips, not for untrusted data exchange.

### Can closures be serialized?

No. `jsoneo` can serialize function bodies, but it cannot automatically capture lexical closures. Use self-contained functions, pass required external values through the `closure` option of `parse(text, options)`, or attach those values to a named function object and access them through `functionName.xxx` inside the function.

### Can it handle circular references?

Yes. Circular references are tracked during serialization and restored during parsing.

### Does it work in browsers?

Yes. Browser environments are supported. Node.js-specific values such as `Buffer` are restored as browser-compatible values when needed.

### Is it safe to parse untrusted input?

No. Do not parse untrusted input. `parse` evaluates generated JavaScript code while restoring complex values.

## License

[MIT](./LICENSE)
