# Installation

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

Install using yarn:

```bash
yarn add jsoneo
```

## Requirements

- Node.js >= 12
- Modern browser with ES2015+ support

## Quick Verification

```ts
import { parse, stringify } from 'jsoneo';

const test = { date: new Date(), map: new Map([['key', 'value']]) };
const serialized = stringify(test);
const restored = parse(serialized);

console.log(restored.date instanceof Date); // true
console.log(restored.map instanceof Map); // true
```
