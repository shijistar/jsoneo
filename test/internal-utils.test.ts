import { describe, expect, it, vi } from 'vitest';
import { parse, stringify } from '../src';
import type { ExpandPrototypeChainOptions } from '../src/types';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  deserializeBinary,
  serializeBinary,
  serializeTypedArray,
} from '../src/utils/binary';
import { SymbolForGetDescriptor, SymbolForSetDescriptor } from '../src/utils/consts';
import { deserializedCode } from '../src/utils/deserializedCode';
import { base64ToString, escapeRegExp, stringToBase64 } from '../src/utils/encode';
import { expandPrototypeChain } from '../src/utils/expandPrototypeChain';
import { getByPath, getFullKeys } from '../src/utils/get';
import { pickPrototype } from '../src/utils/pickPrototype';
import { serializeFunction, serializeRecursively } from '../src/utils/serializeRecursively';
import { getWellKnownSymbols, toSymbolString } from '../src/utils/symbol';

function withoutGlobalBuffer<T>(callback: () => T): T {
  const globalRecord = globalThis as unknown as Record<'Buffer', unknown>;
  const original = globalRecord.Buffer;
  try {
    globalRecord.Buffer = undefined;
    return callback();
  } finally {
    globalRecord.Buffer = original;
  }
}

describe('internal binary and encoding helpers', () => {
  it('uses browser-style base64 helpers when Buffer is unavailable', () => {
    const data = new Uint8Array([226, 156, 147]).buffer;

    const encoded = withoutGlobalBuffer(() => arrayBufferToBase64(data));
    const decoded = withoutGlobalBuffer(() => base64ToArrayBuffer(`data:application/octet-stream;base64,${encoded}`));

    expect(Array.from(new Uint8Array(decoded))).toEqual([226, 156, 147]);
  });

  it('uses browser-style string encoding helpers when Buffer is unavailable', () => {
    const encoded = withoutGlobalBuffer(() => stringToBase64('✓ ok'));
    const decoded = withoutGlobalBuffer(() => base64ToString(encoded));

    expect(decoded).toBe('✓ ok');
  });

  it('serializes and deserializes binary helper variants and error branches', () => {
    const view = new DataView(new Uint8Array([1, 2]).buffer);
    const buffer = new Uint8Array([3, 4]).buffer;
    const typed = new Uint16Array([5, 6]);

    expect(deserializeBinary(serializeBinary(view) as never)).toBeInstanceOf(DataView);
    expect(deserializeBinary(serializeBinary(buffer) as never)).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(deserializeBinary(serializeTypedArray(typed as never)) as Uint16Array)).toEqual([5, 6]);
    if (typeof Buffer !== 'undefined') {
      expect(() => serializeTypedArray(Buffer.from([1]) as unknown as never)).toThrow(
        'Unsupported TypedArray type: Buffer'
      );
    }
    expect(() => deserializeBinary({ kind: 'Other', base64: '', byteLength: 0 } as never)).toThrow(
      'Invalid serialized typed array'
    );
    expect(() =>
      deserializeBinary({ kind: 'TypedArray', type: 'Missing', base64: '', byteLength: 0, length: 0 } as never)
    ).toThrow('TypedArray constructor not available: Missing');
  });

  it('escapes regular expressions with optional double escaping and formatting', () => {
    expect(escapeRegExp(/[a-z]+/)).toBe('\\[a-z\\]\\+');
    expect(escapeRegExp('[x]', { escapeTwice: true, format: (value) => `^${value}$` })).toBe('^\\\\[x\\\\]$');
  });
});

describe('internal path, symbol, and prototype helpers', () => {
  it('resolves paths, descriptor accessors, defaults, and full keys', () => {
    const getter = () => 1;
    const setter = vi.fn();
    const symbol = Symbol('visible');
    const hidden = Symbol('hidden');
    const source: Record<string | symbol, unknown> = { nested: { value: 3 }, [symbol]: 4 };
    Object.defineProperty(source, 'computed', { get: getter, set: setter, enumerable: true, configurable: true });
    Object.defineProperty(source, hidden, { set: vi.fn(), enumerable: true, configurable: true });

    expect(getByPath(null, ['x'], 'fallback')).toBe('fallback');
    expect(getByPath(source, [], 'fallback')).toBe(source);
    expect(getByPath(source, ['nested', 'missing'], 'fallback')).toBe('fallback');
    expect(getByPath(source, ['computed', SymbolForGetDescriptor])).toBeUndefined();
    expect(getByPath(source, [SymbolForGetDescriptor], 'fallback')).toBe('fallback');
    expect(getByPath(source, [SymbolForSetDescriptor], 'fallback')).toBe('fallback');
    const getterHolder = {};
    Object.defineProperty(getterHolder, SymbolForGetDescriptor, { get: () => 'symbol-getter', configurable: true });
    const setterHolder = {};
    Object.defineProperty(setterHolder, SymbolForSetDescriptor, { set: () => undefined, configurable: true });
    expect(typeof getByPath(getterHolder, [SymbolForGetDescriptor])).toBe('function');
    expect(typeof getByPath(setterHolder, [SymbolForSetDescriptor])).toBe('function');
    expect(getByPath(source, ['nested', 'value'])).toBe(3);
    expect(getFullKeys(null)).toEqual([]);
    expect(getFullKeys(source)).toContain(symbol);
    expect(getFullKeys(source)).not.toContain(hidden);
  });

  it('handles well-known, global, described, and anonymous symbols', () => {
    expect(getWellKnownSymbols()).toContain(Symbol.iterator);
    expect(toSymbolString(Symbol.iterator)).toBe('Symbol.iterator');
    expect(toSymbolString(Symbol.for('shared'))).toBe("Symbol.for('shared')");
    expect(toSymbolString(Symbol('local'))).toBe("Symbol('local')");
    expect(toSymbolString(Symbol())).toBeUndefined();
  });

  it('picks prototype members and logs getter failures in debug mode', () => {
    class Base {
      value = 1;

      get broken() {
        throw new Error('broken getter');
      }
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const picked = pickPrototype(new Base(), { debug: true });

    class SilentBroken extends Base {}
    pickPrototype(new SilentBroken());
    expect('broken' in picked).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    log.mockRestore();
  });
});

describe('internal serialization helpers', () => {
  it('serializes function source forms and native functions', () => {
    expect(serializeFunction('get value() { return 1; }')).toBe('function value() { return 1; }');
    expect(serializeFunction('set value(v) { this.v = v; }')).toBe('function value(v) { this.v = v; }');
    expect(serializeFunction('*[Symbol.iterator]() { yield 1; }')).toBe('function* () { yield 1; }');
    expect(serializeFunction('async *stream() { yield 1; }')).toBe('async function* () { yield 1; }');
    expect(serializeFunction('async *[Symbol.asyncIterator]() { yield 1; }')).toBe('async function* () { yield 1; }');
    expect(serializeFunction('method() { return 1; }')).toBe('function method() { return 1; }');
    expect(serializeFunction('[Symbol.toPrimitive]() { return 1; }')).toBe('function () { return 1; }');
    expect(serializeFunction('function native() { [native code] }')).toBeUndefined();
  });

  it('prints debug output while recursively serializing objects', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const symbol = Symbol.for('debug');
    const source = { [symbol]: 'symbol-value', nested: { value: 1 }, omitted: null };

    const result = serializeRecursively(source, {
      debug: true,
      parentPath: [],
      printLabel: 'debug-value',
      printPath: ({ parentPath, key }) => [...(parentPath ?? []), key],
    }) as Record<string, unknown>;

    expect(result["[Symbol.for('debug')]"]).toBe('symbol-value');
    expect(result.omitted).toBe('$SJS$_null_$SJE$');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('expands weak collections, raw JSON, primitive toJSON results, and skipped descriptor paths', () => {
    const weakMap = new WeakMap<object, object>();
    const weakSet = new WeakSet<object>();
    const rawJSON = JSON as typeof JSON & { rawJSON?: (value: string) => unknown };
    const raw = typeof rawJSON.rawJSON === 'function' ? rawJSON.rawJSON('1') : { raw: true };
    const primitiveApi = {
      value: 1,
      toJSON() {
        return 7;
      },
    };
    const debugSource: Record<string, unknown> = {};
    Object.defineProperty(debugSource, 'writeOnly', { set: vi.fn(), enumerable: true, configurable: true });

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const makeOptions = (): ExpandPrototypeChainOptions => ({
      patches: [],
      descriptors: [],
      types: [],
      refs: [],
      apis: [],
      circular: new WeakMap(),
    });

    expect(expandPrototypeChain(null, makeOptions())).toBeNull();
    expect(expandPrototypeChain(Array.prototype, makeOptions())).toBe(Array.prototype);
    const weakMapResult = expandPrototypeChain(weakMap, makeOptions()) as Record<string | symbol, unknown>;
    const weakSetResult = expandPrototypeChain(weakSet, makeOptions()) as unknown[] & { add?: unknown };
    expect(typeof weakMapResult.set).toBe('function');
    expect(Array.isArray(weakSetResult)).toBe(true);
    expect(expandPrototypeChain(raw, makeOptions())).toStrictEqual(raw);
    expect(expandPrototypeChain(primitiveApi, makeOptions())).toBe(7);
    expect(expandPrototypeChain(5, makeOptions())).toBe(5);
    expect(expandPrototypeChain({ plain: true })).toEqual({ plain: true });
    expect(expandPrototypeChain([1], makeOptions())).toEqual([1]);
    function noExtras() {
      return 'ok';
    }
    expect(typeof expandPrototypeChain(noExtras, makeOptions())).toBe('function');
    const globalDescriptor = {};
    Object.defineProperty(globalDescriptor, Symbol.for('visible-descriptor'), {
      value: 1,
      enumerable: false,
      configurable: true,
    });
    const globalDescriptorOptions = makeOptions();
    expandPrototypeChain(globalDescriptor, globalDescriptorOptions);
    expect(globalDescriptorOptions.descriptors[0].key).toBe("[Symbol.for('visible-descriptor')]");
    const anonymousDescriptor = {};
    Object.defineProperty(anonymousDescriptor, Symbol(), { value: 1, enumerable: false, configurable: true });
    expect(
      Object.getOwnPropertySymbols(expandPrototypeChain(anonymousDescriptor, makeOptions()) as object)
    ).toHaveLength(1);
    expandPrototypeChain(debugSource, { ...makeOptions(), debug: true });
    log.mockRestore();
  });
});

describe('parse and generated deserialization code edge paths', () => {
  it('covers custom tags, variable prefixes, debug pretty-print modes, and undefined source handling', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const text = stringify({ value: 1 }, { startTag: '<<', endTag: '>>', variablePrefix: '__ctx__', debug: true });

    const serialized = JSON.parse(text);

    expect(deserializedCode(serialized, { closure: { external: 1 }, isPrinting: true })).toContain('external');
    expect(parse(text, { debug: true, prettyPrint: true })).toEqual({ value: 1 });
    expect(parse(text, { debug: true, prettyPrint: false, closure: { unused: true } })).toEqual({ value: 1 });
    expect(parse(JSON.stringify({ source: undefined }))).toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('covers debug patch path formatting, mid-path defaults, symbol skips, and toJSON-only APIs', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const arrayWithExtra = [1] as number[] & { label?: string };
    arrayWithExtra.label = 'x';
    const anonymous = Symbol();
    const symbolSource = { [anonymous]: 'ignored', [Symbol.for('nullish')]: null };
    const toJSONOnly = {
      value: 4,
      toJSON() {
        return { value: this.value };
      },
    };

    stringify({ arrayWithExtra }, { debug: true, preserveDescriptors: false });
    expect(parse(stringify({ arrayWithExtra }, { debug: true })).arrayWithExtra.label).toBe('x');
    expect(getByPath({ a: null }, ['a', 'b'], 'fallback')).toBe('fallback');
    expect(Object.getOwnPropertySymbols(serializeRecursively(symbolSource, { parentPath: [] }) as object)).toHaveLength(
      2
    );
    expect(parse(stringify({ toJSONOnly }))).toMatchObject({ toJSONOnly: { value: 4 } });
    serializeRecursively(1, undefined as never);
    serializeRecursively(/needs\\escape/g, { parentPath: [] });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
