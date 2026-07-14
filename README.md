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
  // String
  name: 'John',
  // Number
  age: 30,
  // Boolean
  isAdmin: false,
  // Date
  createdAt: new Date(),
  // RegExp
  pattern: /abc/gi,
  // BigInt
  bigValue: 12345678901234567890n,
  // Plain object
  address: {
    city: 'New York',
    zip: '10001',
  },
  // Plain array
  tags: ['developer', 'javascript'],
  // Array with objects
  projects: [
    {
      id: 1,
      name: 'Project 1',
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Project 2',
      createdAt: new Date(),
    },
  ],
  // URL
  homepage: new URL('https://example.com?id=123'),
  // Symbols
  id: Symbol.for('id'),
  [Symbol.toStringTag]: 'User',
  // Map and Set
  roles: new Map([
    [Symbol.for('admin'), true],
    [Symbol.for('editor'), false],
  ]),
  permissions: new Set(['read', 'write']),
  // TypedArray
  bytes: new Uint8Array([1, 2, 3, 4]),
  // ArrayBuffer
  buffer: new ArrayBuffer(8),
  // function
  sayHello: () => `Hello, ${this.name}!`,
};
Object.defineProperties(json, {
  readonlyValue: {
    value: 42,
    writable: false,
  },
  getter: {
    get: () => 'getter value',
    enumerable: true,
    configurable: true,
  },
  setter: {
    set: (value) => console.log('setter called with', value),
    enumerable: true,
    configurable: true,
  },
});

// Serialize
const serialized = stringify(json); // [long string]

// Deserialize
const deserialized = parse(serialized);
```

## Complete use case: share complex test fixtures across environments

A common use case is sharing one complex fixture between Node.js unit tests and browser/e2e tests. With native JSON you would need to rebuild dates, regular expressions, maps, sets, typed arrays, symbol keys, descriptors, and circular references by hand. With `jsoneo`, the fixture can make a round trip as one string.

```ts
import { parse, stringify } from 'jsoneo';

const roleSymbol = Symbol.for('role');

type SharedFixture = {
  name: string;
  scores: Set<number>;
  permissions: Map<string, boolean>;
  payload: Uint8Array;
  createdAt: Date;
  matcher: RegExp;
  bigNumber: bigint;
  canAccess(scope: string): boolean;
  readonly displayName: string;
  secret?: string;
  self?: SharedFixture;
  [key: symbol]: string | undefined;
};

const fixture: SharedFixture = {
  name: 'Leo',
  scores: new Set([98, 100]),
  permissions: new Map([
    ['read', true],
    ['write', true],
  ]),
  payload: new Uint8Array([1, 2, 3]),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  matcher: /^user:\w+$/i,
  bigNumber: 9007199254740993n,
  canAccess(scope: string) {
    // Prefer self-contained functions, parse(text, { closure }), or function object properties.
    const roles = this as SharedFixture & Record<symbol, string | undefined>;
    return scope === 'admin' && roles[Symbol.for('role')] === 'admin';
  },
  get displayName() {
    return `User:${this.name}`;
  },
};

Object.defineProperty(fixture, 'secret', {
  value: 'hidden-token',
  enumerable: false,
  writable: false,
  configurable: false,
});

fixture[roleSymbol] = 'admin';
fixture.self = fixture;

// Serialize in Node.js, a build step, or a fixture generator.
const serialized = stringify(fixture);

// Deserialize in another environment, such as a browser/e2e test.
const restored = parse(serialized) as SharedFixture;

console.log(restored.canAccess('admin')); // true
console.log(restored.displayName); // User:Leo
console.log(restored.createdAt instanceof Date); // true
console.log(restored.matcher.test('user:leo')); // true
console.log(restored.scores instanceof Set); // true
console.log(restored.permissions.get('write')); // true
console.log(restored.payload instanceof Uint8Array); // true
console.log(restored[roleSymbol]); // admin
console.log(Object.getOwnPropertyDescriptor(restored, 'secret')?.enumerable); // false
console.log(restored.self === restored); // true
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
| `preserveClassConstructor` | `boolean` | `false`    | Whether to preserve class constructor code during serialization. |
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

### Handling function dependencies

Function bodies can be serialized, but JavaScript closures cannot be captured automatically. If a restored function needs external values, provide them through the `closure` option of `parse(text, options)`.

```ts
import { parse, stringify } from 'jsoneo';

const allowedRoles = ['admin', 'editor'];

const source = {
  canRead(user: { role: string }) {
    return allowedRoles.includes(user.role);
  },
};

const text = stringify(source);
const restored = parse(text, {
  // The function body references `allowedRoles`, so provide it explicitly.
  closure: {
    allowedRoles,
  },
});

console.log(restored.canRead({ role: 'admin' })); // true
```

Alternatively, attach serializable values directly to a named function object, then read them inside the function through `functionName.xxx`. Because functions are objects, `jsoneo` can preserve those properties together with the function.

```ts
import { parse, stringify } from 'jsoneo';

function canRead(user: { role: string }) {
  return canRead.allowedRoles.includes(user.role);
}

namespace canRead {
  export let allowedRoles: string[];
}

canRead.allowedRoles = ['admin', 'editor'];

const text = stringify({ canRead });
const restored = parse(text) as { canRead: typeof canRead };

console.log(restored.canRead({ role: 'admin' })); // true
console.log(restored.canRead.allowedRoles); // ['admin', 'editor']
```

Use a named function for this pattern. Anonymous functions, arrow functions, or object method shorthand do not provide the same reliable self-reference for `functionName.xxx` inside the function body.

## Important notes and limitations

- `parse` should only be used with strings produced by `stringify` and from trusted sources.
- Function source code can be serialized, but closures are not captured automatically. Use the `closure` option of `parse(text, options)` for external values, or attach serializable values to a named function object and access them through `functionName.xxx`.
- Native functions cannot be serialized because their source is reported as `[native code]`.
- Avoid `Function.prototype.bind()`: bound functions are native-like and cannot be reconstructed reliably.
- Anonymous symbols are limited, especially when used as object keys. Prefer well-known symbols or `Symbol.for()` for stable round trips.
- Class constructors are not preserved by default. Use `preserveClassConstructor` only when you understand the trade-offs.
- Private class fields and private methods are not accessible from outside the object and are not suitable serialization targets.
- `Map` values are supported, but non-string keys are not guaranteed to round-trip faithfully in the current implementation.
- In browsers, Node.js `Buffer` values are restored as `Uint8Array` when `Buffer` is unavailable.
- `WeakMap` and `WeakSet` entries are not enumerable, so only their structure can be represented.

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
