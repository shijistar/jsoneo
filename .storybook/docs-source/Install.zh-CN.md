# 安装

使用 npm 安装：

```bash
npm install jsoneo
```

使用 pnpm 安装：

```bash
pnpm add jsoneo
```

使用 bun 安装：

```bash
bun add jsoneo
```

使用 yarn 安装：

```bash
yarn add jsoneo
```

## 要求

- Node.js >= 12
- 支持 ES2015+ 的现代浏览器

## 快速验证

```ts
import { parse, stringify } from 'jsoneo';

const test = { date: new Date(), map: new Map([['key', 'value']]) };
const serialized = stringify(test);
const restored = parse(serialized);

console.log(restored.date instanceof Date); // true
console.log(restored.map instanceof Map); // true
```
