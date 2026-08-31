# 介绍

**jsoneo**（读作 /ˈdʒeɪ.sən ˌniː.oʊ/，类似 "JSON new"）是一个强大的 JSON 增强库，用于序列化和反序列化原生 `JSON.stringify()` 和 `JSON.parse()` 难以表示的复杂 JavaScript 值。

## 原生 JSON 的问题

原生 JSON 简单且可移植，但会丢失 JavaScript 特有的信息：

- `Date` 变为字符串（ISO 8601 格式）
- `Map`、`Set`、`RegExp`、`BigInt`、`Symbol`、类型化数组和函数无法忠实保留
- `undefined`、`NaN`、`Infinity`、`-Infinity` 和 `-0` 需要特殊处理
- 不可枚举属性、访问器、属性描述符和原型方法会被丢弃
- 循环引用会抛出错误

## jsoneo 保留的内容

`jsoneo` 保持熟悉的 `stringify` / `parse` 工作流，同时保留更多原始 JavaScript 值：

| 类别              | 支持的类型                                                     |
| ----------------- | -------------------------------------------------------------- |
| **JSON 基础类型** | `string`、`number`、`boolean`、`null`、纯对象、数组            |
| **特殊值**        | `undefined`、`NaN`、`Infinity`、`-Infinity`、`-0`、`BigInt`    |
| **内建对象**      | `Date`、`RegExp`、`URL`、`URLSearchParams`、`Error`            |
| **集合**          | `Map`、`Set`、`WeakMap`（仅结构）、`WeakSet`（仅结构）         |
| **二进制数据**    | 所有 TypedArrays、 `ArrayBuffer`、`DataView`、Node.js `Buffer` |
| **函数**          | 普通、箭头、异步、生成器函数、方法                             |
| **Symbol**        | 知名 Symbol、全局 Symbol (`Symbol.for()`)、局部 Symbol         |
| **高级特性**      | 属性描述符、原型链、循环引用、自定义 `toJSON`/`fromJSON`       |

## 使用场景

- 在单元测试和 e2e 测试之间共享测试夹具
- 在 Node.js 和浏览器测试运行器之间移动复杂对象
- 为调试快照复杂的 JavaScript 值
- 保留包含函数、Symbol、Map、Set、描述符和循环引用的对象图
- 跨多个运行时环境复用测试套件

## 来源

本项目从 [enum-plus](https://github.com/shijistar/enum-plus) 提取而来，当时用于将浏览器测试中的 `Enum` 对象序列化回 Node.js，以便在 Playwright e2e 测试中复用相同的 Jest 测试套件。项目之前名为 [serialize-everything.js](https://github.com/shijistar/serialize-everything.js)。

## 安全

⚠️ **重要：** `jsoneo.parse()` 通过执行生成的 JavaScript 代码来恢复复杂值。只解析由 `jsoneo.stringify()` 从**可信来源**产生的数据。切勿解析不可信的用户输入、来自不可信服务的网络数据或任意字符串。jsoneo 不是沙箱或安全边界。
