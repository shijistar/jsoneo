## 重新深度评估一下stringify/parse方法的安全性，这两个方法配对使用的话，会导致意外执行被序列化函数体的代码吗？

## 结论

**会。当前实现不能保证 `parse(stringify(value))` 不执行意外代码，也绝不具备与原生 `JSON.parse(JSON.stringify(...))` 相同的安全级别。**

更精确地说：

- 普通 `function () { ... }`、箭头函数的方法体，在 `parse()` 时通常只是被重新创建，**不会立即调用**。
- 但 `parse()` 会把序列化结果拼成 JavaScript 源码，并通过 `new Function(...)` **直接求值**，见 [src/index.ts:146-170](src/index.ts#L146-L170)。
- 因此以下代码会在 `parse()` 阶段执行：
  - class 的静态块、静态字段初始化器、`extends` 表达式、计算属性名；
  - `fromJSON()`；
  - 被覆盖的函数 `toString()` 返回的任意表达式；
  - 特殊标记碰撞产生的普通字符串代码；
  - `Error.message`、Symbol 名称等未经安全转义而注入的代码；
  - 被伪造或修改的序列化文本中的任意代码。

所以 [src/index.ts:55-64](src/index.ts#L55-L64) 中“与 JSON 相同安全级别”“不会执行恶意代码”的说明是错误的，建议立即删除或改写。

---

## 我实际验证到的行为

### 1. 普通字符串也能在配对调用中变成代码

我测试了：

```ts
const input = '$SJS$_(()=>{globalThis.__jsoneo_probe=1;return 42})()_$SJE$';

const output = parse(stringify(input));
```

实际结果：

```text
output === 42
globalThis.__jsoneo_probe === 1
```

也就是说，输入原本只是一个普通字符串，但因为它碰巧符合默认标记格式：

```text
$SJS$_ ... _$SJE$
```

经过 `stringify()` 后，`parse()` 将它当成 JavaScript 表达式执行了。

根因是：

1. `serializeRecursively()` 对普通字符串没有进行标记冲突转义，见 [src/utils/serializeRecursively.ts:109-119](src/utils/serializeRecursively.ts#L109-L119)。
2. `decodeFormat()` 通过正则删除标记两侧的 JSON 引号，把字符串直接转换为代码，见 [src/utils/deserializedCode.ts:338-352](src/utils/deserializedCode.ts#L338-L352)。
3. 转换结果被嵌入 `deserializeResult = (...)` 并传给 `new Function()`，见 [src/utils/deserializedCode.ts:31-36](src/utils/deserializedCode.ts#L31-L36)。

这意味着即使序列化文本没有在传输途中被篡改，**只要原对象中包含用户可控字符串，就可能产生代码执行**。

---

### 2. class 静态代码会在反序列化时再次执行

我验证了：

```ts
globalThis.__probe = 0;

class C {
  static {
    globalThis.__probe++;
  }
}

const restored = parse(stringify(C));
```

class 首次定义时执行一次静态块，`parse()` 重新求值 class 源码时又执行一次：

```text
定义后：1
parse 后：2
```

这是 JavaScript 的正常 class 求值语义。即使没有任何注入漏洞，只要完整 class 源码被重新执行，以下内容都会产生即时副作用：

```ts
class Example extends getBaseClass() {
  static value = performSideEffect();

  static {
    performAnotherSideEffect();
  }

  [computePropertyName()]() {}
}
```

普通方法体本身不会被调用，但这些表达式是在“创建 class”时执行的。

另外：

- 对根 class 值，`preserveClassConstructor: false` 目前也不能阻止完整 class 表达式被序列化。
- 对 class 实例，当前真实默认行为会保留 prototype 上的 `constructor`，因此也可能重新执行静态初始化代码。

这里还存在文档与实现不一致：

- 类型文档宣称 `preserveClassConstructor` 默认是 `false`，见 [src/types.ts:51-52](src/types.ts#L51-L52)。
- `pickPrototype()` 中实际默认值却是 `true`，见 [src/utils/pickPrototype.ts:11-20](src/utils/pickPrototype.ts#L11-L20)。

我实测 class 实例在默认配置下，`parse()` 会再次执行其 constructor class 的静态块；显式设置 `preserveClassConstructor: false` 后才没有再次执行。

---

### 3. `fromJSON()` 会被明确调用

序列化时，代码会主动调用：

```ts
result = source.toJSON();
```

见 [src/utils/expandPrototypeChain.ts:141-155](src/utils/expandPrototypeChain.ts#L141-L155)。

反序列化时，如果存在 `fromJSON`，则明确执行：

```ts
const result = fromJSON(value);
```

见 [src/utils/deserializedCode.ts:173-196](src/utils/deserializedCode.ts#L173-L196)。

我验证过：

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

`parse()` 后：

```text
globalThis.__fromJSONExecuted === true
```

因此 `fromJSON` 不是“仅恢复一个函数”，而是反序列化生命周期钩子。其函数体必定在 `parse()` 中执行。

---

### 4. 函数自己的 `toString()` 可以伪造待执行代码

函数序列化使用的是：

```ts
source.toString();
```

见 [src/utils/serializeRecursively.ts:109-115](src/utils/serializeRecursively.ts#L109-L115)，而不是：

```ts
Function.prototype.toString.call(source);
```

所以函数可以覆盖 `toString`：

```ts
const fn = function benign() {};

fn.toString = () => '(()=>{globalThis.__executed=1;return function restored(){}})()';

parse(stringify(fn));
```

实测 `parse()` 后：

```text
globalThis.__executed === 1
```

这也是完整的 `stringify()` → `parse()` 配对调用，没有修改中间字符串。

Proxy 还可以通过 `get` trap 模拟同样行为。

---

### 5. Symbol key 存在明确的代码注入

Symbol key 会先转成字符串，例如：

```ts
Symbol.for('name');
```

见 [src/utils/symbol.ts:14-22](src/utils/symbol.ts#L14-L22)。

反序列化时再通过：

```ts
return new Function('return ' + expression)();
```

进行恢复，见 [src/utils/deserializedCode.ts:321-331](src/utils/deserializedCode.ts#L321-L331)。

我验证了：

```ts
const key = Symbol.for("x'),globalThis.__sym_probe=1,Symbol.for('y");

parse(stringify({ [key]: 123 }));
```

生成的 key 表达式类似：

```js
(Symbol.for('x'), (globalThis.__sym_probe = 1), Symbol.for('y'));
```

实际结果：

```text
globalThis.__sym_probe === 1
```

因此，**一个本地创建并正常经过 `stringify()` 的 Symbol key 就能在 `parse()` 中执行任意表达式**。

这不是“中间数据被篡改”才会出现的问题。

---

### 6. `Error.message` 也存在代码注入

Error 当前被序列化成：

```ts
`${ST}new Error('${source.message}')${ET}`;
```

见 [src/utils/serializeRecursively.ts:70-71](src/utils/serializeRecursively.ts#L70-L71)。

`source.message` 未作为 JavaScript 字符串字面量安全编码。

我验证了：

```ts
const error = new Error("x'),globalThis.__err_probe=1,new Error('y");

const restored = parse(stringify(error));
```

结果：

```text
globalThis.__err_probe === 1
String(restored) === "Error: y"
```

Symbol description、`Symbol.for()` key、部分 RegExp 相关内容也有类似的字符串字面量转义问题。

---

## 普通函数到底会不会立即执行？

对于这种普通函数：

```ts
function work() {
  globalThis.__called = true;
}
```

执行：

```ts
const restored = parse(stringify(work));
```

`parse()` 本身通常不会进入 `{ ... }` 方法体。只有随后调用：

```ts
restored();
```

才会执行。

原因是反序列化生成的大致代码是：

```js
const deserializeResult = function work() {
  globalThis.__called = true;
};
```

这只是创建函数。

但是，“普通函数体不立即调用”**不等于安全**，因为：

1. 外层仍然在执行动态生成的 JavaScript；
2. class 定义包含求值期代码；
3. `fromJSON` 会被主动调用；
4. `source.toString()` 可以返回任意表达式，而不一定是函数定义；
5. 数据字符串和 Symbol/Error 等也能突破到代码上下文。

---

## `stringify()` 本身也不是无副作用的

不仅 `parse()` 有执行风险，`stringify()` 也会触发用户代码：

### Getter

prototype 展开使用：

```ts
target[key] = source[key];
```

见 [src/utils/pickPrototype.ts:34-46](src/utils/pickPrototype.ts#L34-L46)。

对象属性复制也使用：

```ts
result[key] = source[key];
```

见 [src/utils/expandPrototypeChain.ts:195-240](src/utils/expandPrototypeChain.ts#L195-L240)。

因此 getter 会在 stringify 阶段执行。我实测一个 enumerable getter 在 `stringify()` 时执行了一次。

### 其他副作用来源

还包括：

- `toJSON()`；
- `source.toString()`；
- `source[Symbol.iterator]` 和 `Array.from(source)`；
- Proxy 的 `get`、`ownKeys`、`getOwnPropertyDescriptor` 等 trap；
- Map/Set 迭代器。

所以整个库应被定义为“可执行对象快照/代码序列化器”，而不是 JSON 的安全增强版。

---

## 风险模型

| 场景                                                      | 当前安全性                                 |
| --------------------------------------------------------- | ------------------------------------------ |
| `parse()` 接收外部或被篡改的数据                          | **任意代码执行，严重**                     |
| 中间字符串有签名，但原对象包含用户可控字符串/Error/Symbol | **仍可能代码执行**                         |
| 原对象完全可信，函数和 hooks 均经过审查                   | 可以使用，但会有预期或意外副作用           |
| 普通函数，无 hooks、无 class 初始化、无特殊标记碰撞       | `parse()` 通常只创建函数，不立即调用函数体 |
| 与 `JSON.parse()` 同等安全                                | **不成立**                                 |

---

## 建议

### 立即修正文档和 API 定位

不要再宣称：

> 与 JSON 相同安全级别  
> No malicious code will be evaluated

建议改成类似：

> `parse()` evaluates JavaScript code using `new Function`. It must only be used with fully trusted serialized objects and serialized text. Deserialization may execute class initializers, `fromJSON` hooks, and other embedded expressions. It is not equivalent to `JSON.parse` and must not be used as a security boundary.

最好将当前 API 更明确地命名为：

```ts
parseUnsafe();
parseTrusted();
```

或者要求显式选项：

```ts
parse(input, { allowCodeExecution: true });
```

### 必须修复的具体问题

1. **废弃“字符串标记 + 去引号”机制**  
   使用结构化 tagged value，例如：

   ```json
   {
     "$jsoneoType": "Function",
     "source": "function () {}"
   }
   ```

   普通字符串永远不应通过内容匹配被解释成代码。

2. **函数源码应使用 intrinsic 方法读取**

   ```ts
   Function.prototype.toString.call(source);
   ```

   但这只能防止覆盖 `toString`，不能消除函数代码求值本身的风险。

3. **Symbol 恢复不能使用 `new Function`**

   Symbol 类型应结构化存储，例如：

   ```json
   {
     "kind": "global",
     "key": "some key"
   }
   ```

   然后直接调用：

   ```ts
   Symbol.for(key);
   ```

4. **所有数据到代码字符串的转换使用安全字面量编码**

   例如 Error：

   ```ts
   `new Error(${JSON.stringify(source.message)})`;
   ```

   RegExp：

   ```ts
   `new RegExp(${JSON.stringify(source.source)}, ${JSON.stringify(source.flags)})`;
   ```

   不过更好的方案仍然是不生成代码，而是直接调用构造器。

5. **默认不恢复 class constructor**

   修正 `preserveClassConstructor` 默认值和文档不一致，并保证根 class 也遵守该配置。

6. **`fromJSON` 改为显式 opt-in 或 allowlist**

   自动调用任意恢复函数本质上就是反序列化代码执行。

7. **增加严格 schema 校验**

   校验：
   - `version`
   - `source`
   - `types`
   - `patches`
   - `refs`
   - `apis`
   - `descriptors`
   - 路径成员类型
   - tag 和变量名前缀

8. **提供真正的安全模式**

   真正安全的 `safeParse()` 应满足：
   - 不使用 `eval`/`new Function`；
   - 不恢复函数、class、getter、setter；
   - 不调用 `fromJSON`；
   - 不执行用户提供的 getter/iterator；
   - 只通过明确的类型表恢复 Date、Map、Set、TypedArray 等数据类型。

---

## 最终判断

**是的，配对使用也会导致被序列化代码在 `parse()` 阶段意外执行。**

其中：

- 普通函数的普通方法体一般不会自动调用；
- class 静态初始化和 `fromJSON` 会自动执行；
- 当前还有多个可以让普通数据突破为可执行表达式的漏洞，尤其是：
  - 默认 tag 字符串碰撞；
  - Symbol key 的 `new Function`；
  - Error message 未转义；
  - 可覆盖的函数 `toString()`。

因此，当前实现应按**具有任意代码执行能力的反序列化器**对待，而不是按 JSON parser 对待。
