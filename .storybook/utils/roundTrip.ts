import { serializeFunction } from '../../src/utils/serializeRecursively';
import { storyI18n } from '../locales';

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
  } else if (typeof value === 'bigint') return `${value}n`;
  else if (typeof value === 'string') return JSON.stringify(value);
  else if (typeof value === 'boolean') return String(value);
  else if (value === null) return 'null';
  else if (typeof value === 'undefined') return 'undefined';
  else if (value instanceof RegExp) {
    return `/${value.source}/${value.flags}`;
  } else if (value instanceof URL) {
    return `new URL("${value}")`;
  } else if (value instanceof URLSearchParams) {
    return `new URLSearchParams("${value.toString()}")`;
  } else if (value instanceof Map) {
    return `new Map(${formatValueInner([...value.entries()], depth + 1, seen)})`;
  } else if (value instanceof Set) {
    return `new Set(${formatValueInner([...value.values()], depth + 1, seen)})`;
  } else if (
    [
      Int8Array,
      Uint8Array,
      Uint8ClampedArray,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array,
      BigInt64Array,
      BigUint64Array,
    ].some((type) => value instanceof type)
  ) {
    return `new ${value.constructor.name}(${Array.from(value as [])})`;
  } else if (typeof Buffer !== 'undefined' && value instanceof Buffer) {
    return `new Buffer("${value.toString('hex')}")`;
  } else if (value instanceof ArrayBuffer) {
    return `new ArrayBuffer()`;
  } else if (value instanceof DataView) {
    return `new DataView()`;
  } else if (value instanceof Error) {
    return `new Error("${value.message}")`;
  } else if (typeof value === 'symbol') {
    if (Symbol.keyFor(value)) {
      return `Symbol.for("${Symbol.keyFor(value)}")`;
    } else if (Object.values(Object.getOwnPropertyDescriptors(Symbol)).some((d) => d.value === value)) {
      return value.description!;
    } else {
      return `Symbol("${value.description}")`;
    }
  } else if (value instanceof Date) return `new Date("${value.toISOString()}")`;
  else if (typeof value === 'function') {
    const name = (value as Function).name || 'anonymous';
    return serializeFunction(value.toString()) || '';
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
    const keys = [...Object.keys(value), ...Object.getOwnPropertySymbols(value)];
    if (keys.length === 0) return '{}';
    const items = keys.map((key) => {
      const d = Object.getOwnPropertyDescriptor(value, key);
      const isDefault = d && 'value' in d && d.writable && d.enumerable && d.configurable;
      const v = isDefault
        ? formatValueInner((value as Record<string | symbol, unknown>)[key], depth + 1, seen)
        : formatValueInner(d, depth + 1, seen);
      return `${pad}  ${typeof key === 'string' ? JSON.stringify(key) : `[${formatValueInner(key, 0, seen)}]`}: ${v}`;
    });
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
  const t = (key: string, options?: Record<string, unknown>) => storyI18n.t(key, options);
  if (original === restored) return { passed: true, reason: t('story.roundTrip.identicalReferences') };
  if (typeof original === 'function' && typeof restored === 'function') {
    return { passed: true, reason: t('story.roundTrip.bothFunctions') };
  }
  if (typeof original !== typeof restored)
    return {
      passed: false,
      reason: t('story.roundTrip.typeMismatch', { original: typeof original, restored: typeof restored }),
    };
  try {
    const origStr = JSON.stringify(original);
    const restStr = JSON.stringify(restored);
    if (origStr === restStr) return { passed: true, reason: t('story.roundTrip.jsonMatch') };
  } catch {}
  return { passed: false, reason: t('story.roundTrip.valuesDiffer') };
}

// Type definitions for the jsoneo API - actual imports done in stories
export type StringifyFn = (value: unknown, options?: { preserveDescriptors?: boolean; debug?: boolean }) => string;
export type ParseFn = (
  input: string,
  options?: { closure?: Record<string, unknown>; debug?: boolean; prettyPrint?: boolean },
) => unknown;
