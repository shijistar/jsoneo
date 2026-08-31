# 高级模式

## 跨运行时测试 fixture

可以在 Node.js 单元测试和浏览器端到端测试之间共享同一份 fixture：

```ts
export const userFixture = {
  id: Symbol.for('user.id'),
  name: 'Test User',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  roles: new Map([['admin', true]]),
  permissions: new Set(['read', 'write']),
  greet() {
    return `Hello, ${this.name}`;
  },
};

const serialized = stringify(userFixture);
const restored = parse(serialized);
```

建议将 fixture 放在测试代码中，并在 Node.js 与浏览器中分别验证类型、方法和引用关系。

## 自定义序列化

可以通过对象的 `toJSON` / `fromJSON` 约定实现应用层的自定义恢复逻辑。需要注意：具体恢复行为取决于对象的构造函数和运行时上下文，不能把自定义字段当作安全校验。

```ts
class CustomData {
  constructor(public data: unknown) {}
  toJSON() {
    return { __type: 'CustomData', payload: this.data };
  }
}

const serialized = stringify(new CustomData({ value: 42 }));
const restored = parse(serialized);
```

## 保留 class 实例

```ts
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
  distance() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

const restored = parse(
  stringify(new Point(3, 4), {
    preserveClassConstructor: true,
  }),
);
```

构造函数依赖外部变量时，必须确认恢复环境已经提供这些依赖。

## 函数的外部依赖

函数体不会自动捕获词法作用域。需要恢复外部变量时，应通过 `closure` 显式传入可信值；不要把用户输入直接放入 closure。

```ts
const API_BASE = 'https://api.example.com';
function endpoint(id: string) {
  return `${API_BASE}/users/${id}`;
}

const restored = parse(stringify({ endpoint }), {
  closure: { API_BASE },
});
```

## Symbol 与循环引用

优先使用 `Symbol.iterator` 等 well-known symbol 或 `Symbol.for()` 创建的全局 symbol。自引用和相互引用可以直接序列化并恢复：

```ts
const parent: { child?: unknown } = {};
const child = { parent };
parent.child = child;

const restored = parse(stringify(parent));
// restored.child.parent === restored
```
