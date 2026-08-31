export function formatValue(value: unknown): string {
  return formatValueInner(value, 0, new WeakSet<object>());
}

function formatValueInner(value: unknown, depth: number, seen: WeakSet<object>): string {
  const pad = '  '.repeat(depth);

  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    if (Object.is(value, -0)) return '-0';
    return String(value);
  }
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'symbol') return String(value);
  if (typeof value === 'function') {
    const name = (value as Function).name || 'anonymous';
    return `[Function: ${name}]`;
  }

  // 循环引用：仅拦截当前路径上的环（进入 add、退出 delete），DAG 重复引用不误判
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map((item) => `${pad}  ${formatValueInner(item, depth + 1, seen)}`);
      return `[\n${items.join(',\n')}\n${pad}]`;
    }
    // Date 保持 toJSON 行为（输出 ISO 字符串带引号）
    if (value instanceof Date) {
      return JSON.stringify(value);
    }
    // 非 plain object（Map/Set/RegExp/URL/TypedArray 等）保持 JSON.stringify 原有行为
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const items = keys.map(
      (key) =>
        `${pad}  ${JSON.stringify(key)}: ${formatValueInner((value as Record<string, unknown>)[key], depth + 1, seen)}`,
    );
    return `{\n${items.join(',\n')}\n${pad}}`;
  } finally {
    seen.delete(value);
  }
}

export function getTypeSummary(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `Array[${value.length}]`;
  const typeName = Object.prototype.toString.call(value).slice(8, -1);
  if (typeName !== 'Object') return typeName;
  return `Object{${Object.keys(value as object).length}}`;
}

export interface RoundTripResult {
  passed: boolean;
  reason: string;
}

export function checkRoundTrip(original: unknown, restored: unknown): RoundTripResult {
  if (original === restored) return { passed: true, reason: 'Identical references' };
  if (typeof original === 'function' && typeof restored === 'function') {
    return { passed: true, reason: 'Both functions (bodies may differ, closure not captured)' };
  }
  if (typeof original !== typeof restored)
    return { passed: false, reason: `Type mismatch: ${typeof original} vs ${typeof restored}` };
  try {
    const origStr = JSON.stringify(original);
    const restStr = JSON.stringify(restored);
    if (origStr === restStr) return { passed: true, reason: 'JSON stringify match' };
  } catch {}
  return { passed: false, reason: 'Values differ after round-trip' };
}

// Type definitions for the jsoneo API - actual imports done in stories
export type StringifyFn = (value: unknown, options?: { preserveDescriptors?: boolean; debug?: boolean }) => string;
export type ParseFn = (
  input: string,
  options?: { closure?: Record<string, unknown>; debug?: boolean; prettyPrint?: boolean },
) => unknown;
