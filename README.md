# jsoneo

[![npm latest version](https://img.shields.io/npm/v/jsoneo.svg?cacheSeconds=86400)](https://www.npmjs.com/package/jsoneo)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/shijistar/jsoneo)
![GitHub License](https://img.shields.io/github/license/shijistar/jsoneo?label=License&color=ff8000&cacheSeconds=86400)

A powerful JSON enhancement library that supports all JSON primitives, Date, RegExp, Symbol, Functions, Map, Set, TypedArray and much more! Almost everything in JavaScript.

A perfect partner for unit testing, which allowing `Node.js` (or others) and `e2e` tests to share one copy of test suite. Please check more details in the [enum-plus](https://github.com/shijistar/enum-plus/blob/master/test/engines/index.ts) project.

> Write once, run in multiple environments.

This project was extracted from [enum-plus](https://github.com/shijistar/enum-plus). It was designed to serialize `Enum` objects from Browser to Node.js, so that the same test suites in `Jest` can be reused in `Playwright` e2e tests. We don't have to duplicate our test logic in the two testing frameworks. This project was also previously named _[serialize-everything.js](https://github.com/shijistar/serialize-everything.js)_

## Features

- Serialize and deserialize almost everything in JavaScript
- Interface with existing JSON APIs seamlessly
- Built-in support for circular references
- TypeScript support for better developer experience
- **Function serialization**
  - Regular functions
  - Arrow functions
  - Async functions
  - Generator functions
  - Class methods
  - Function properties
- **Special values support**
  - `NaN`, `Infinity`, `-Infinity`, `-0`
  - `undefined` (in objects, following JSON semantics)
- **Symbol handling**
  - Built-in symbols (like `Symbol.iterator`)
  - Global symbols (via `Symbol.for`)
  - Local symbols with descriptions
  - Symbol as object keys
- **Advanced property handling**
  - Non-enumerable properties preservation
  - Getter/setter methods (accessor properties)
  - Property descriptors (writable, configurable, enumerable)
- **Prototype chain handling**
  - Complete prototype chain serialization
  - Preserves prototype methods and properties
- **Browser and Node.js compatibility**
  - Automatic environment detection
  - Buffer handling (falls back to Uint8Array in browsers)
- **Raw JSON preservation**
  - Direct support for `JSON.rawJSON()` objects
- **Custom API**
  - Support for custom serialization and deserialization logic
  - `toJSON`/`fromJSON` method respect
  - Automatic API method preservation

## Installation

Install using npm:

```bash
npm install jsoneo
```

Install using pnpm:

```bash
pnpm add jsoneo
```

Install using bun:

```bash
bun add jsoneo
```

Or using yarn:

```bash
yarn add jsoneo
```

## Supported Types

- **JSON Primitives:**
  - `string`
  - `number`
  - `boolean`
  - `BigInt`
  - `null`
  - `plain object`
  - `array`

- **Extended Types:**
  - `Date`
  - `RegExp`
  - `Symbol`
  - `Function`
    - Normal functions
    - Arrow functions
    - Generator functions
    - Async functions
    - Classes
  - `Map`
  - `Set`
  - `WeakMap` (Structure only, without data)
  - `WeakSet` (Structure only, without data)
  - `URL`
  - `URLSearchParams`
  - `TypedArray`
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
  - `Buffer`
  - `Error`
  - `Iterable`
  - `RawJSON`（via `JSON.rawJSON()`）

## Usage

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

// Serialize
const serialized = stringify(json);
console.log('Serialized:', serialized);

// Deserialize
const deserialized = parse(serialized);
console.log('Deserialized:', deserialized);
```
