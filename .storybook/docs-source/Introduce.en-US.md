# Introduction

**jsoneo** (pronounced /ˈdʒeɪ.sən ˌniː.oʊ/, like "JSON new") is a powerful JSON enhancement library for serializing and deserializing complex JavaScript values that native `JSON.stringify()` and `JSON.parse()` cannot represent well.

## What's wrong with native JSON?

Native JSON is simple and portable, but it loses JavaScript-specific information:

- `Date` becomes a string (ISO 8601 format)
- `Map`, `Set`, `RegExp`, `BigInt`, `Symbol`, typed arrays, and functions are not faithfully preserved
- `undefined`, `NaN`, `Infinity`, `-Infinity`, and `-0` need special handling
- Non-enumerable properties, accessors, property descriptors, and prototype methods are dropped
- Circular references throw errors

## What jsoneo preserves

`jsoneo` keeps the familiar `stringify` / `parse` workflow while preserving much more of the original JavaScript value:

| Category             | Supported Types                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **JSON Primitives**  | `string`, `number`, `boolean`, `null`, plain objects, arrays                                                                    |
| **Special Values**   | `undefined`, `NaN`, `Infinity`, `-Infinity`, `-0`, `BigInt`                                                                     |
| **Built-in Objects** | `Date`, `RegExp`, `URL`, `URLSearchParams`, `Error`                                                                             |
| **Collections**      | `Map`, `Set`, `WeakMap` (structure), `WeakSet` (structure)                                                                      |
| **Binary Data**      | All TypedArrays (`Int8Array`, `Uint8Array`, `Float32Array`, `BigInt64Array`, etc.), `ArrayBuffer`, `DataView`, Node.js `Buffer` |
| **Functions**        | Regular, arrow, async, generator functions, methods                                                                             |
| **Symbols**          | Well-known symbols, global symbols (`Symbol.for()`), local symbols                                                              |
| **Advanced**         | Property descriptors, prototype chain, circular references, custom `toJSON`/`fromJSON`                                          |

## Use Cases

- Sharing test fixtures between unit tests and e2e tests
- Moving complex objects between Node.js and browser test runners
- Snapshotting complex JavaScript values for debugging
- Preserving object graphs with functions, symbols, maps, sets, descriptors, and circular references
- Reusing test suites across multiple runtime environments

## Origin

This project was extracted from [enum-plus](https://github.com/shijistar/enum-plus), where it was used to serialize `Enum` objects from browser tests back to Node.js so the same Jest test suites could be reused in Playwright e2e tests. It was previously named [serialize-everything.js](https://github.com/shijistar/serialize-everything.js).

## Security

⚠️ **Important:** `jsoneo.parse()` executes generated JavaScript code to restore complex values. Only parse data produced by `jsoneo.stringify()` from **trusted sources**. Never parse untrusted user input, network data from untrusted services, or arbitrary strings. jsoneo is NOT a sandbox or security boundary.
