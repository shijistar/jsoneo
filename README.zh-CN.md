# jsoneo

[![npm latest version](https://img.shields.io/npm/v/jsoneo.svg?cacheSeconds=86400)](https://www.npmjs.com/package/jsoneo)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/shijistar/jsoneo)
![GitHub License](https://img.shields.io/github/license/shijistar/jsoneo?label=License&color=ff8000&cacheSeconds=86400)

[English](./README.md) | **简体中文**

> 面向真实 JavaScript 对象的增强版 JSON。

`jsoneo` 是一个 JSON 增强序列化/反序列化库，用来处理原生 `JSON.stringify()` 和 `JSON.parse()` 难以完整表达的复杂 JavaScript 值，例如 `Date`、`RegExp`、`BigInt`、`Symbol`、函数、`Map`、`Set`、TypedArray、属性描述符、原型成员、循环引用等。

当你需要在 Node.js、浏览器、端到端测试环境之间传递复杂测试数据或对象图时，`jsoneo` 会非常有用。

> 一次编写，多环境复用。

## 为什么使用 jsoneo？

原生 JSON 简单、通用，但会丢失大量 JavaScript 语义：

- `Date` 会变成字符串。
- `Map`、`Set`、`RegExp`、`BigInt`、`Symbol`、TypedArray、函数等无法被完整保留。
- `undefined`、`NaN`、`Infinity`、`-Infinity`、`-0` 需要特殊处理。
- 非枚举属性、访问器、属性描述符、原型方法会被丢弃。
- 循环引用会直接报错。

`jsoneo` 保留了熟悉的 `stringify` / `parse` 使用方式，同时尽可能恢复原始 JavaScript 值的结构和行为。

## 安装

```bash
npm install jsoneo
```

## 快速开始

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
    city: '纽约',
    zip: '10001',
  },
  // Plain array
  tags: ['developer', 'javascript'],
  // Array with objects
  projects: [
    {
      id: 1,
      name: '项目1',
      createdAt: new Date(),
    },
    {
      id: 2,
      name: '项目2',
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
  sayHello: () => `你好，${this.name}！`,
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

// 序列化
const serialized = stringify(json); // [一个长字符串]

// 反序列化
const deserialized = parse(serialized);
```

## 完整用例：跨环境共享复杂测试 fixture

一个典型场景是：在 Node.js 单元测试和浏览器/e2e 测试之间共享同一份复杂 fixture。使用原生 JSON 时，你需要手动恢复日期、正则、Map、Set、TypedArray、Symbol key、属性描述符和循环引用；使用 `jsoneo` 时，这个复杂 fixture 可以作为一个字符串完成往返传递。

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
    // 推荐使用自包含函数，或通过 parse(text, { closure }) 显式传入外部变量。
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

// 可以在 Node.js、构建脚本或 fixture 生成器中序列化。
const serialized = stringify(fixture);

// 可以在另一个环境中反序列化，例如浏览器/e2e 测试。
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

## 支持的数据

### JSON 兼容值

- `string`
- `number`
- `boolean`
- `null`
- 普通对象
- 数组

### JavaScript 特有值

- 对象中的 `undefined`，遵循 JSON 语义
- `NaN`
- `Infinity`
- `-Infinity`
- `-0`
- `BigInt`
- `Date`
- `RegExp`
- `Symbol`
  - well-known symbols，例如 `Symbol.iterator`
  - 通过 `Symbol.for()` 创建的全局 Symbol
  - 作为值使用时，支持带 description 的本地 Symbol
  - Symbol 对象 key 推荐使用 well-known symbols 或 `Symbol.for()` 创建的 Symbol
- 函数
  - 普通函数
  - 箭头函数
  - async 函数
  - generator 函数
  - class method
  - 函数属性
- `Map`
- `Set`
- `WeakMap`，仅保留结构，不保留条目
- `WeakSet`，仅保留结构，不保留条目
- `URL`
- `URLSearchParams`
- TypedArray
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
- 可迭代对象
- 循环引用
- 原型方法和属性
- 自定义属性描述符
- 非枚举属性
- getter / setter 描述符
- 运行环境支持时的 `JSON.rawJSON()` 对象
- 对象上的 `toJSON` / `fromJSON` 自定义方法

> 几乎所有 JavaScript 值！

## API

### `stringify(value, options?)`

将 JavaScript 值序列化为字符串。

```ts
import { stringify } from 'jsoneo';

const text = stringify(value, options);
```

#### `StringifyOptions`

| 选项                       | 类型      | 默认值     | 说明                                        |
| -------------------------- | --------- | ---------- | ------------------------------------------- |
| `startTag`                 | `string`  | `'$SJS$_'` | 用于编码 JavaScript 表达式的内部起始标记。  |
| `endTag`                   | `string`  | `'_$SJE$'` | 用于编码 JavaScript 表达式的内部结束标记。  |
| `variablePrefix`           | `string`  | `'$SJV$_'` | 生成变量名时使用的前缀。                    |
| `preserveClassConstructor` | `boolean` | `false`    | 是否在序列化时保留 class constructor 代码。 |
| `preserveDescriptors`      | `boolean` | `true`     | 是否保留自定义属性描述符。                  |
| `debug`                    | `boolean` | `false`    | 是否打印序列化调试信息。                    |

### `parse(input, options?)`

反序列化由 `stringify` 生成的字符串。

```ts
import { parse } from 'jsoneo';

const value = parse(text, options);
```

#### `ParseOptions`

| 选项          | 类型                      | 默认值           | 说明                                      |
| ------------- | ------------------------- | ---------------- | ----------------------------------------- |
| `closure`     | `Record<string, unknown>` | `undefined`      | 恢复函数时可用的外部变量。                |
| `get`         | `GetFunc`                 | 内置路径读取函数 | 恢复 patch 时用于读取子值的自定义函数。   |
| `prettyPrint` | `boolean`                 | `true`           | 在 debug 输出中格式化生成的反序列化代码。 |
| `debug`       | `boolean`                 | `false`          | 是否打印反序列化调试信息。                |

### 使用 `closure` 恢复函数依赖

函数体可以被序列化，但 JavaScript 的词法闭包无法自动捕获。如果恢复后的函数依赖外部变量，需要通过 `parse(text, options)` 的 `closure` 选项显式传入。

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
  // 函数体引用了 `allowedRoles`，因此需要显式传入。
  closure: {
    allowedRoles,
  },
});

console.log(restored.canRead({ role: 'admin' })); // true
```

## 重要说明与限制

- `parse` 只应处理由 `stringify` 生成且来自可信来源的数据。
- 函数源码可以被序列化，但闭包不会被自动捕获。外部变量请使用 `parse(text, options)` 的 `closure` 选项显式传入。
- 原生函数无法序列化，因为它们的源码通常是 `[native code]`。
- 避免使用 `Function.prototype.bind()`：绑定函数接近原生函数，通常无法可靠重建。
- 匿名 Symbol 的能力有限，尤其是作为对象 key 使用时。为了稳定往返，优先使用 well-known symbol 或 `Symbol.for()`。
- class constructor 默认不会保留。只有在理解权衡后才建议使用 `preserveClassConstructor`。
- 私有 class 字段和私有方法无法从对象外部访问，不适合作为序列化目标。
- `Map` 的值支持往返；但当前实现不保证非字符串 key 能完整保真。
- 在浏览器中，如果没有 Node.js `Buffer`，`Buffer` 会被恢复为 `Uint8Array`。
- `WeakMap` 和 `WeakSet` 的条目不可枚举，因此只能表示其结构，不能保留内部条目。

## 安全注意事项

`jsoneo` 可以恢复函数、访问器、属性描述符和原型相关数据。`parse` 在恢复复杂值时会生成并执行 JavaScript 代码。

因此：

- 只解析由 `jsoneo.stringify()` 生成的数据；
- 只解析可信来源的数据；
- 不要把用户输入、不可信网络数据或未经审查的第三方 payload 传给 `parse`；
- 不要把 `jsoneo` 当作沙箱或安全边界。

如果你需要交换不可信数据，请使用原生 JSON 或其他纯数据格式。

## 浏览器与 Node.js 兼容性

`jsoneo` 面向 Node.js 和浏览器环境设计。对于环境相关的值会尽可能自动处理，例如在浏览器中没有 `Buffer` 时将 Node.js `Buffer` 恢复为 `Uint8Array`。

当前 package 声明支持 Node.js `>=12`。`BigInt` 和 BigInt TypedArray 等能力仍要求运行环境本身支持这些特性。

## 常见使用场景

- 在单元测试和 e2e 测试之间共享同一份 fixture。
- 在 Node.js 和浏览器测试运行器之间传递复杂对象。
- 为调试场景快照复杂 JavaScript 值。
- 保留包含函数、Symbol、Map、Set、TypedArray、属性描述符、循环引用的对象图。
- 在多个运行环境中复用同一套测试逻辑。

本项目提取自 [enum-plus](https://github.com/shijistar/enum-plus)。最初的需求是在浏览器测试中把 `Enum` 对象序列化回 Node.js，从而让同一套 Jest 测试可以复用于 Playwright e2e 测试。本项目此前曾名为 [serialize-everything.js](https://github.com/shijistar/serialize-everything.js)。

## FAQ

### jsoneo 是 JSON 的直接替代品吗？

不完全是。它提供类似 `stringify` / `parse` 的 API，但目标是可信 JavaScript 对象的往返恢复，而不是处理不可信数据交换。

### 可以序列化闭包吗？

不能。它可以序列化函数体，但不能自动捕获词法闭包。请使用自包含函数，或通过 `parse(text, options)` 的 `closure` 选项传入必要的外部变量。

### 支持循环引用吗？

支持。序列化时会跟踪循环引用，并在反序列化时恢复引用关系。

### 支持浏览器吗？

支持。浏览器环境可以使用。对于 Node.js 特有值，例如 `Buffer`，会在需要时恢复为浏览器兼容的值。

### 可以解析不可信输入吗？

不可以。不要解析不可信输入。`parse` 在恢复复杂值时会执行生成的 JavaScript 代码。

## License

[MIT](./LICENSE)
