# `stringify` / `parse` 安全性深度评估

- **评估日期：** 2026-07-16
- **评估范围：** `stringify()`、`parse()` 及其函数、class、特殊类型、Symbol、属性描述符、`toJSON` / `fromJSON` 恢复链路
- **核心问题：** 两个方法配对使用时，是否会在 `parse()` 阶段意外执行被序列化函数体或其他代码？

## 评估一下stringify/parse方法的安全性，会导致意外执行被序列化函数体的代码吗？

## 一、最终结论

**会。当前实现不能保证 `parse(stringify(value))` 不执行意外代码，也不具备与原生 `JSON.parse(JSON.stringify(...))` 相同的安全级别。**

更精确地说：

- 普通 `function () { ... }` 和箭头函数的方法体，在 `parse()` 时通常只是被重新创建，**不会立即调用**。
- 但是，`parse()` 会把序列化结果拼接成 JavaScript 源码，并通过 `new Function(...)` **直接求值**。
- 因而 class 静态块、静态字段初始化器、`extends` 表达式、计算属性名、`fromJSON()` 以及注入到生成源码中的任意表达式，都会在 `parse()` 阶段执行。
- 即使中间序列化字符串没有被篡改，只要原始对象包含特定普通字符串、恶意 Symbol 名称、恶意 Error message、伪造的函数 `toString()` 或带副作用的 class / hook，也可能发生代码执行。

因此，当前实现必须按**具有任意代码执行能力的可信代码反序列化器**对待，而不能按普通 JSON parser 对待。

`src/index.ts` 中当前关于“与 JSON 具有相同安全级别”和“反序列化期间不会执行恶意代码”的说明不成立，应尽快删除或改写。

---

## 二、核心执行链路

`parse()` 的关键流程是：

1. 使用 `JSON.parse(input)` 得到 `SerializedResult`。
2. 调用 `deserializedCode()`，把 `source`、`patches`、`types`、`apis`、`refs` 和 `descriptors` 拼接为一整段 JavaScript 源码。
3. 使用下列方式编译并立即执行生成的源码：

```ts
return new Function(`${VP}context`, `${VP}options`, code)(closure, { get });
```

对应位置：

- `src/index.ts:146-170`
- `src/utils/deserializedCode.ts:16-59`
- `src/utils/deserializedCode.ts:334-336`

这意味着 `parse()` 本质上不是“数据解析”，而是“动态源码生成与执行”。只要任何攻击者可控内容进入生成的源码上下文，就可能形成代码执行。

此外，Symbol key 的恢复还会再次使用嵌套的 `new Function`：

```ts
function keyToSymbol(key) {
  const expression = key.replace(symbolKeyPrefixRegExp, '').replace(symbolKeySuffixRegExp, '');
  return new Function('return ' + expression)();
}
```

对应位置：`src/utils/deserializedCode.ts:321-331`。

---

## 三、普通函数体是否会在 `parse()` 阶段自动执行？

对于普通函数：

```ts
function work() {
  globalThis.__called = true;
}
```

执行：

```ts
const restored = parse(stringify(work));
```

生成的代码在概念上类似：

```js
const deserializeResult = function work() {
  globalThis.__called = true;
};
```

这一步只是创建函数对象，不会进入普通函数的方法体。只有随后显式调用：

```ts
restored();
```

方法体才会执行。

但是，“普通函数体通常不立即执行”**不等于安全**，原因包括：

1. 外层动态生成的 JavaScript 始终会被执行。
2. 序列化的内容不一定是纯函数声明或函数表达式。
3. class 定义本身可以包含求值期代码。
4. `fromJSON()` 会被反序列化流程主动调用。
5. 函数自己的 `toString()` 可以伪造任意表达式。
6. 普通数据字符串及特殊类型字段可以突破到代码上下文。

---

## 四、已确认的配对调用代码执行路径

以下问题均可在没有修改中间序列化文本的情况下，通过正常的 `parse(stringify(value))` 配对调用触发。

### 4.1 普通字符串与内部标记碰撞，可直接执行代码

默认代码标记为：

```text
$SJS$_ ... _$SJE$
```

测试输入：

```ts
const input = '$SJS$_(()=>{globalThis.__jsoneo_probe=1;return 42})()_$SJE$';

const output = parse(stringify(input));
```

实测结果：

```text
output === 42
globalThis.__jsoneo_probe === 1
```

输入原本只是普通字符串，却在配对反序列化后被当作 JavaScript 表达式执行。

#### 根因

1. `serializeRecursively()` 对普通字符串没有进行内部标记冲突转义：`src/utils/serializeRecursively.ts:109-119`。
2. `decodeFormat()` 使用正则删除标记旁的 JSON 字符串引号：`src/utils/deserializedCode.ts:338-352`。
3. 处理后的内容被直接放入：

   ```js
   const deserializeResult = (...);
   ```

4. 整体代码最终交给 `new Function()` 执行。

#### 安全影响

这是最严重的问题之一，因为攻击载荷不需要以函数、class 或自定义对象出现。只要业务数据中包含用户可控字符串，且字符串可构造为默认或自定义标记格式，就可能在 `parse()` 阶段执行。

---

### 4.2 class 静态代码会在反序列化时再次执行

测试：

```ts
globalThis.__probe = 0;

class C {
  static {
    globalThis.__probe++;
  }
}

const restored = parse(stringify(C));
```

class 首次定义时静态块执行一次；`parse()` 重新求值 class 源码时又执行一次：

```text
定义后：1
parse 后：2
```

这是 JavaScript class 的正常求值语义。除了静态块，以下内容也会在创建 class 时求值：

```ts
class Example extends getBaseClass() {
  static value = performSideEffect();

  static {
    performAnotherSideEffect();
  }

  [computePropertyName()]() {}
}
```

可能立即执行的内容包括：

- `extends` 后的表达式；
- static field initializer；
- static block；
- computed property name；
- decorators 或编译产物中的初始化逻辑（取决于实际传入源码）。

#### `preserveClassConstructor` 默认值不一致

类型文档宣称默认值是 `false`：

- `src/types.ts:51-52`

但 `pickPrototype()` 的实际默认值为 `true`：

```ts
const { preserveClassConstructor = true, debug } = options ?? {};
```

对应位置：`src/utils/pickPrototype.ts:11-20`。

实测结果：

- class 实例在默认配置下经过 `parse(stringify(instance))` 时，会重新执行 constructor class 的静态块。
- 显式设置 `{ preserveClassConstructor: false }` 后，该测试中的静态块没有再次执行。
- 对根 class 值本身，当前选项也不能可靠地保证完整 class 表达式不被序列化和求值。

---

### 4.3 `fromJSON()` 会被明确调用

序列化阶段会主动调用：

```ts
result = source.toJSON();
```

对应位置：`src/utils/expandPrototypeChain.ts:141-155`。

反序列化阶段，如果恢复出的 `fromJSON` 是函数，则会主动调用：

```ts
const result = fromJSON(value);
```

对应位置：`src/utils/deserializedCode.ts:173-196`。

测试：

```ts
const value = {
  toJSON() {
    return { safe: true };
  },

  fromJSON(data) {
    globalThis.__fromJSONExecuted = true;
    return data;
  },
};

parse(stringify(value));
```

实测：

```text
globalThis.__fromJSONExecuted === true
```

因此 `fromJSON` 不是单纯被恢复为函数对象，而是反序列化生命周期钩子，其函数体会在 `parse()` 中执行。

---

### 4.4 函数自己的 `toString()` 可以伪造待执行代码

函数序列化当前使用：

```ts
source.toString();
```

对应位置：`src/utils/serializeRecursively.ts:109-115`。

它没有使用不可被实例覆盖的 intrinsic 调用：

```ts
Function.prototype.toString.call(source);
```

因此函数可以覆盖自己的 `toString()`：

```ts
const fn = function benign() {};

fn.toString = () => '(()=>{globalThis.__executed=1;return function restored(){}})()';

parse(stringify(fn));
```

实测结果：

```text
globalThis.__executed === 1
```

这同样是完整的配对调用，没有篡改中间序列化字符串。

Proxy 也可以通过 `get` trap 模拟或扩大这一攻击面。

使用 `Function.prototype.toString.call(source)` 可以防止简单的实例级 `toString` 覆盖，但只能修复这一条注入路径，无法消除 class 求值、标记碰撞、`fromJSON` 或动态代码执行本身的风险。

---

### 4.5 Symbol key 存在明确的代码注入

Symbol key 序列化时会转换为类似以下字符串：

```ts
Symbol.for('name');
```

对应位置：`src/utils/symbol.ts:14-22`。

反序列化时，字符串会被交给：

```ts
new Function('return ' + expression)();
```

测试：

```ts
const key = Symbol.for("x'),globalThis.__sym_probe=1,Symbol.for('y");

parse(stringify({ [key]: 123 }));
```

生成的表达式类似：

```js
(Symbol.for('x'), (globalThis.__sym_probe = 1), Symbol.for('y'));
```

实测结果：

```text
globalThis.__sym_probe === 1
```

最终恢复的 key 变成 `Symbol(y)`，同时注入表达式已经执行。

因此，一个在本地正常创建并经过 `stringify()` 的全局 Symbol key，就能在 `parse()` 中执行任意表达式。

---

### 4.6 `Error.message` 存在代码注入

Error 当前被序列化为：

```ts
`${ST}new Error('${source.message}')${ET}`;
```

对应位置：`src/utils/serializeRecursively.ts:70-71`。

`source.message` 没有作为 JavaScript 字符串字面量安全编码。

测试：

```ts
const error = new Error("x'),globalThis.__err_probe=1,new Error('y");

const restored = parse(stringify(error));
```

实测结果：

```text
globalThis.__err_probe === 1
String(restored) === 'Error: y'
```

因此，普通 Error message 数据能够跳出字符串字面量并执行表达式。

Symbol description、`Symbol.for()` key 以及其他通过字符串拼接生成 JavaScript 字面量的特殊类型，也应按相同原则进行审计。

---

## 五、`stringify()` 本身也会执行用户代码

风险不仅存在于 `parse()`。`stringify()` 在读取和展开对象时也可能触发副作用。

### 5.1 Getter

prototype 展开使用：

```ts
target[key] = source[key];
```

对应位置：`src/utils/pickPrototype.ts:34-46`。

对象属性复制也使用：

```ts
result[key] = source[key];
```

对应位置：`src/utils/expandPrototypeChain.ts:195-240`。

测试一个 enumerable getter 后确认：

- getter 在 `stringify()` 阶段执行一次；
- 恢复出的 getter 在 `parse()` 阶段没有被立即调用；
- 读取恢复对象上的相应属性时再次执行。

### 5.2 其他序列化副作用来源

`stringify()` 还可能触发：

- `toJSON()`；
- 函数或对象的 `toString()`；
- `source[Symbol.iterator]`；
- `Array.from(source)`；
- Map / Set 迭代；
- Proxy 的 `get`、`ownKeys`、`getOwnPropertyDescriptor` 等 trap；
- URL、URLSearchParams 等类型的转换方法；
- 自定义 getter 依赖的任意业务逻辑。

因此整个库更接近“可执行对象快照 / 代码序列化器”，而不是无副作用的 JSON 增强器。

---

## 六、来自不可信序列化文本的风险

即使修复所有已知的配对调用注入路径，只要 `parse()` 继续接受可修改的文本并通过 `new Function()` 执行，未经认证的输入仍然等价于任意代码执行。

攻击者可直接修改以下字段：

- `source`；
- `startTag`；
- `endTag`；
- `variablePrefix`；
- `apis` 中的 `toJSON` / `fromJSON`；
- `descriptors` 中的 getter / setter；
- `patches`；
- `refs`；
- Symbol key 表达式；
- 类型恢复元数据。

当前仅执行 TypeScript 类型断言：

```ts
const inputResult = JSON.parse(input) as SerializedResult;
```

这不是运行时校验。输入不存在严格 schema 验证，也不存在签名、MAC 或来源认证。

因此：

> “只调用 `parse()` 处理由 `stringify()` 生成的数据”并不是充分的安全条件。

还必须确保：

1. 原始对象及其所有字符串、Symbol、Error、函数、class、getter、hook 完全可信；
2. 序列化文本在存储和传输过程中没有被修改；
3. 解析端的 `closure`、`get` 等注入项也可信；
4. 运行环境允许承担任意代码执行的后果。

---

## 七、风险分级

| 场景                                         | 当前判断                                     |
| -------------------------------------------- | -------------------------------------------- |
| `parse()` 接收外部、用户提交或可被篡改的数据 | **严重：任意代码执行**                       |
| 中间文本可信，但原对象含用户可控字符串       | **严重：默认标记碰撞可执行代码**             |
| 原对象含用户可控 Symbol key 或 Error message | **严重：已确认注入**                         |
| 原对象含未知函数或可覆盖 `toString()` 的函数 | **严重：已确认注入**                         |
| 原对象含 class 静态初始化逻辑                | **高风险：`parse()` 时再次执行**             |
| 原对象含 `fromJSON()`                        | **高风险：`parse()` 主动调用**               |
| 原对象含 getter、iterator 或 Proxy           | **中高风险：`stringify()` 期间执行副作用**   |
| 原对象及序列化文本完全可信且代码已审查       | 可以使用，但必须接受反序列化执行代码与副作用 |
| 声称与 `JSON.parse()` 同等安全               | **不成立**                                   |

---

## 八、文档和 API 定位建议

### 8.1 立即删除错误的安全声明

不应继续宣称：

> The `stringify` and `parse` methods are secure when used together, with the same level of security as `JSON`.

也不应宣称：

> No malicious code will be evaluated during serialization and deserialization.

建议改为：

> `parse()` evaluates generated JavaScript using `new Function`. Only use it with fully trusted objects and serialized text. Deserialization may execute class initializers, `fromJSON` hooks, embedded expressions, and other code. It is not equivalent to `JSON.parse` and must not be used as a security boundary.

建议同时提供中文说明：

> `parse()` 会通过 `new Function` 求值动态生成的 JavaScript。只能用于完全可信的原始对象和序列化文本。反序列化可能执行 class 初始化器、`fromJSON` 钩子和其他嵌入表达式。它与 `JSON.parse` 的安全模型不同，不得作为安全边界处理不可信数据。

### 8.2 明确体现危险性的 API

可考虑：

```ts
parseTrusted(input);
parseUnsafe(input);
```

或者要求调用方显式确认：

```ts
parse(input, { allowCodeExecution: true });
```

这不能消除漏洞，但能降低调用方误把它当作安全 JSON parser 的概率。

---

## 九、修复建议

### 9.1 废弃“字符串标记 + 去引号”协议

当前协议将：

```text
$SJS$_..._$SJE$
```

视为代码，导致普通字符串和内部代码表示不可区分。

应改为结构化 tagged value，例如：

```json
{
  "$jsoneoType": "Function",
  "source": "function () {}"
}
```

普通字符串必须始终作为普通字符串保留，不能根据字符串内容自动进入代码解释路径。

为了避免用户对象与 tag 对象碰撞，应进一步使用：

- 独立节点表和引用 ID；或
- 明确的 envelope/version/schema；或
- 不可由普通业务对象直接伪造的内部二进制/结构化格式；或
- 对 tag 对象实施严格字段集、类型与版本验证。

### 9.2 函数源码使用 intrinsic 方法读取

将：

```ts
source.toString();
```

改为：

```ts
Function.prototype.toString.call(source);
```

同样应考虑保存 intrinsic 引用，避免 realm 或全局 prototype 被修改。

该修复只能防止实例覆盖 `toString()`，无法消除函数源码求值本身的风险。

### 9.3 Symbol 恢复不得使用 `new Function`

Symbol 应结构化存储，例如：

```json
{
  "kind": "global",
  "key": "some key"
}
```

恢复时直接调用：

```ts
Symbol.for(key);
```

well-known Symbol 可使用受限映射：

```ts
const wellKnownSymbols = {
  iterator: Symbol.iterator,
  asyncIterator: Symbol.asyncIterator,
  toPrimitive: Symbol.toPrimitive,
};
```

不得把 Symbol 描述或 key 当作 JavaScript 表达式执行。

### 9.4 所有数据到源码的转换必须安全编码

如果短期内仍保留源码生成方案，至少应使用安全字面量编码。

Error：

```ts
`new Error(${JSON.stringify(source.message)})`;
```

RegExp：

```ts
`new RegExp(${JSON.stringify(source.source)}, ${JSON.stringify(source.flags)})`;
```

Symbol：不要生成表达式；应按 9.3 结构化恢复。

但这只是临时缓解。更合理的做法是完全停止为普通数据类型生成 JavaScript 源码，直接在受控恢复逻辑中调用构造器。

### 9.5 默认不恢复 class constructor

需要：

1. 修复 `preserveClassConstructor` 文档和实际默认值不一致的问题；
2. 默认值设为 `false`；
3. 保证根 class、嵌套 class、实例 prototype constructor 都统一遵守该选项；
4. 在开启时明确警告 class 求值会执行静态初始化代码。

### 9.6 `fromJSON` 改为显式 opt-in 或 allowlist

自动恢复并调用任意 `fromJSON` 本质上就是反序列化代码执行。

可考虑：

```ts
parse(input, {
  allowFromJSON: false,
});
```

或者使用调用方提供的可信类型注册表：

```ts
parse(input, {
  types: {
    User: {
      fromJSON: trustedUserFromJSON,
    },
  },
});
```

序列化文本中只保存类型 ID，不保存并执行函数源码。

### 9.7 增加严格运行时 schema 校验

至少校验：

- `version`；
- `source`；
- `types`；
- `patches`；
- `refs`；
- `apis`；
- `descriptors`；
- 路径成员类型；
- type 名称 allowlist；
- tag 格式；
- `variablePrefix` 是否为合法标识符前缀；
- 数组长度、对象深度和节点数量限制。

但需要强调：schema 校验不能使任意函数源码变得安全，只能降低格式伪造和异常输入风险。

### 9.8 提供真正的安全模式

真正的 `safeParse()` 应满足：

- 不使用 `eval` 或 `new Function`；
- 不恢复函数或 class；
- 不恢复 getter / setter；
- 不调用 `fromJSON`；
- 不执行序列化文本提供的任何代码；
- 只通过固定 allowlist 恢复 Date、RegExp、Map、Set、ArrayBuffer、TypedArray 等纯数据类型；
- 使用结构化类型标签而不是代码标记；
- 防止 prototype pollution；
- 有深度、大小、节点数和引用数限制；
- 对 `__proto__`、`prototype`、`constructor` 等路径进行明确处理；
- 不把自定义 `get` 函数作为不可信恢复流程的一部分。

危险的函数恢复能力应与安全数据恢复能力拆成两个不同 API。

---

## 十、建议新增的安全回归测试

至少覆盖以下测试：

1. 普通字符串包含默认 start/end tag，不得被执行。
2. 普通字符串包含自定义 start/end tag，不得被执行。
3. Error message 含单引号、反斜线、换行和代码片段，不得跳出字面量。
4. `Symbol.for()` key 含引号、逗号、括号和代码片段，不得被求值。
5. anonymous Symbol description 含特殊字符，不得被求值。
6. 函数覆盖自身 `toString()` 时，不得控制序列化源码。
7. Proxy 拦截 `toString`、`ownKeys`、descriptor 读取时的行为应被明确记录和限制。
8. class static block 在默认配置下不得因恢复实例而执行。
9. 根 class 必须遵守 `preserveClassConstructor`。
10. `fromJSON` 默认不得执行，或必须仅通过显式 opt-in 执行。
11. getter 在安全序列化模式下不得被调用。
12. 被篡改的 `source`、`apis`、`descriptors`、`patches` 和 `variablePrefix` 必须被拒绝。
13. `__proto__`、`prototype`、`constructor` 路径不能造成 prototype pollution。
14. 超深对象、超大 refs/patches 和循环结构必须受到资源限制。
15. CSP 禁止 `unsafe-eval` 的浏览器环境中，应给出明确且可诊断的错误。

---

## 十一、测试验证摘要

本次评估实际运行了针对以下场景的最小验证：

| 验证项                                                                    | 结果                           |
| ------------------------------------------------------------------------- | ------------------------------ |
| 普通函数字面量在 `parse()` 时是否进入函数体                               | 通常不会，调用恢复函数时才执行 |
| class static block 是否在 `parse()` 时执行                                | **会**                         |
| class 实例默认是否恢复 constructor 并执行静态块                           | **会**                         |
| 显式 `preserveClassConstructor: false` 是否阻止该实例测试中的静态块重执行 | 会阻止                         |
| `fromJSON()` 是否在 `parse()` 时执行                                      | **会**                         |
| Getter 是否在 `stringify()` 时执行                                        | **会**                         |
| 默认标记格式的普通字符串是否被作为代码执行                                | **会**                         |
| 被覆盖的函数 `toString()` 是否可注入表达式                                | **会**                         |
| 恶意 `Symbol.for()` key 是否可执行表达式                                  | **会**                         |
| 恶意 Error message 是否可执行表达式                                       | **会**                         |

这些结果足以否定“配对调用与 JSON 同等安全”这一安全声明。

---

## 十二、最终判断

**`stringify()` 和 `parse()` 配对使用时，确实可能在 `parse()` 阶段意外执行被序列化的代码。**

具体区分如下：

- 普通函数的普通方法体一般不会因函数对象被重建而自动调用；
- class 静态初始化逻辑会在 class 表达式被重新求值时执行；
- `fromJSON()` 会被恢复流程主动调用；
- 普通字符串可因内部标记碰撞变成可执行表达式；
- Symbol key 会进入嵌套 `new Function`，已确认可注入；
- Error message 未安全转义，已确认可注入；
- 函数实例覆盖 `toString()` 后，可控制待执行源码；
- `stringify()` 自身也会通过 getter、`toJSON`、iterator 和 Proxy trap 执行用户逻辑。

因此，当前实现应被定义为：

> **仅适用于完全可信对象和完全可信序列化文本的可执行代码序列化器。**

它不应被用于：

- API 请求体；
- 用户输入；
- 数据库中可被其他主体修改的数据；
- 跨信任边界消息；
- 浏览器 `localStorage` 中可被 XSS 修改的数据；
- 消息队列或缓存中的未认证数据；
- 任何需要以 `JSON.parse()` 安全模型处理的数据。

在完成协议重构前，最重要的短期措施是：

1. 删除错误的安全声明；
2. 明确标注 `parse()` 会执行代码；
3. 禁止处理不可信输入；
4. 修复普通字符串标记碰撞、Symbol、Error 和函数 `toString()` 注入；
5. 默认关闭 constructor 和 `fromJSON` 恢复；
6. 设计不依赖动态源码执行的 `safeParse()`。
