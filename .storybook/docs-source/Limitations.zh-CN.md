# 限制与已知问题

## Closure 限制

函数的词法闭包不会自动捕获：

```ts
const secret = 'hidden';
function getSecret() {
  return secret;
}

const restored = parse(stringify({ getSecret }));
// restored.getSecret() 可能因 secret 未定义而失败
```

如需恢复外部变量，请使用 `parse(serialized, { closure: { secret } })`，并确保值来自可信代码。

## Symbol 与 Map key 限制

本地匿名 symbol 不一定能可靠恢复，建议使用 well-known symbol 或 `Symbol.for()`。Map 的非字符串 key 可能在序列化过程中转为字符串，不能假设对象身份会保留。

## WeakMap / WeakSet

条目不可枚举，因此只能保留结构，不能恢复其中的 entries。

## 私有字段与原生函数

`#privateField`、私有方法和原生函数的实现细节无法从外部访问。原生函数通常因为源码是 `[native code]` 而不能重建；绑定函数也不保证可靠恢复。

## 浏览器与 Node.js 差异

| 能力             | Node.js             | 浏览器                  |
| ---------------- | ------------------- | ----------------------- |
| `Buffer`         | 完整支持            | 可能降级为 `Uint8Array` |
| `BigInt64Array`  | 取决于运行时版本    | 取决于浏览器支持        |
| `JSON.rawJSON()` | 取决于 Node.js 版本 | 取决于浏览器支持        |

## 安全与性能

`parse()` 会执行生成的 JavaScript 代码，jsoneo **不是 sandbox**。不要解析用户输入、未知网络数据或任意字符串；不可信数据交换应使用原生 JSON 等数据格式。

大型对象图和 debug 模式可能带来明显性能开销。序列化和反序列化应使用兼容的 jsoneo 版本，并为版本升级保留回归测试。
