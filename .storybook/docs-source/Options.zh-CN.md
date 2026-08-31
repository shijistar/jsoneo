# 选项参考

## StringifyOptions

```ts
interface StringifyOptions {
  startTag?: string;
  endTag?: string;
  variablePrefix?: string;
  preserveClassConstructor?: boolean;
  preserveDescriptors?: boolean;
  debug?: boolean;
}
```

- `startTag`：序列化表达式的起始标记，默认 `$SJS$_`。
- `endTag`：序列化表达式的结束标记，默认 `_$SJE$`。
- `variablePrefix`：生成变量名的前缀，默认 `$SJV$_`。
- `preserveClassConstructor`：是否保留 class 构造函数代码，默认 `false`。
- `preserveDescriptors`：是否保留自定义属性描述符，默认 `true`。
- `debug`：是否输出序列化调试信息，默认 `false`。

标记通常不需要修改，只有在与数据冲突时才应自定义：

```ts
stringify(value, {
  startTag: '<<START>>',
  endTag: '<<END>>',
  variablePrefix: '<<VAR>>',
});
```

## ParseOptions

```ts
interface ParseOptions {
  closure?: Record<string, unknown>;
  get?: GetFunc;
  prettyPrint?: boolean;
  debug?: boolean;
}
```

- `closure`：为恢复的函数提供外部变量。词法闭包不会自动被序列化。
- `get`：恢复 patch 值时使用的自定义路径读取函数。
- `prettyPrint`：是否格式化生成的恢复代码，默认 `true`。
- `debug`：是否输出反序列化调试信息，默认 `false`。

示例：

```ts
const allowedRoles = ['admin', 'editor'];
const serialized = stringify({
  canRead(user: { role: string }) {
    return allowedRoles.includes(user.role);
  },
});

const restored = parse(serialized, { closure: { allowedRoles } });
```

> `parse()` 会执行生成的 JavaScript 代码。`closure` 只能传入可信值，不能把它当作安全沙箱。
