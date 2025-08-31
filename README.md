# jsoneo

A powerful JSON enhancement library that supports all JSON primitives, Date, RegExp, Symbol, Functions, Map, Set, TypedArray and much more! Almost everything in JavaScript.

Write once. Run in Jest and e2e.

A perfect partner for unit testing, which allowing `Jest` and `e2e` tests to share one copy of test suite. Please check more details in the [enum-plus](https://github.com/shijistar/enum-plus) project.

This library is extracted from [enum-plus](https://github.com/shijistar/enum-plus).

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

- JSON primitives:
  - `string`
  - `number`
  - `boolean`
  - `BigInt`
  - `null`
  - `plain object`
  - `array`

- Extended types
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
  - `WeakMap` (Only structure, without data)
  - `WeakSet` (Only structure, without data)
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
  - `Blob`
  - `Buffer`
  - `Error`
  - `Iterable`
  - `RawJSON`（via `JSON.rawJSON()`）
