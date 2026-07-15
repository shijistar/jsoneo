import { describe, expect, it } from 'vitest';
import { parse, stringify } from '../src';
import type { ParseOptions, StringifyOptions } from '../src/types';

function roundTrip<T>(value: T, stringifyOptions?: StringifyOptions, parseOptions?: ParseOptions): T {
  return parse(stringify(value, stringifyOptions), parseOptions) as T;
}

function bytes(value: ArrayBuffer | ArrayBufferView): number[] {
  const buffer =
    value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  return Array.from(new Uint8Array(buffer));
}

describe('jsoneo round trips primitives and built-ins', () => {
  it('preserves JSON primitives and special primitive values', () => {
    const restored = roundTrip({
      string: 'hello',
      empty: '',
      boolean: true,
      falseValue: false,
      nil: null,
      missing: undefined,
      zero: 0,
      negativeZero: -0,
      integer: 42,
      decimal: 3.14,
      nan: NaN,
      positiveInfinity: Infinity,
      negativeInfinity: -Infinity,
      bigint: BigInt('9007199254740993'),
    });

    expect(restored.string).toBe('hello');
    expect(restored.empty).toBe('');
    expect(restored.boolean).toBe(true);
    expect(restored.falseValue).toBe(false);
    expect(restored.nil).toBeNull();
    expect('missing' in restored).toBe(false);
    expect(restored.zero).toBe(0);
    expect(Object.is(restored.negativeZero, -0)).toBe(true);
    expect(restored.integer).toBe(42);
    expect(restored.decimal).toBe(3.14);
    expect(Number.isNaN(restored.nan)).toBe(true);
    expect(restored.positiveInfinity).toBe(Infinity);
    expect(restored.negativeInfinity).toBe(-Infinity);
    expect(restored.bigint).toBe(BigInt('9007199254740993'));
  });

  it('returns undefined for empty or undefined serialized input', () => {
    expect(parse('')).toBeUndefined();
    expect(roundTrip(undefined)).toBeUndefined();
  });

  it('preserves Date, invalid Date, RegExp, Error, URL, and URLSearchParams', () => {
    const source = {
      date: new Date('2024-01-02T03:04:05.006Z'),
      invalidDate: new Date(NaN),
      regexp: /user:\w+/gi,
      error: new Error('boom'),
      url: new URL('https://example.com/path?q=1'),
      params: new URLSearchParams('a=1&b=two'),
    };

    const restored = roundTrip(source);

    expect(restored.date).toBeInstanceOf(Date);
    expect(restored.date.toISOString()).toBe('2024-01-02T03:04:05.006Z');
    expect(restored.invalidDate).toBeInstanceOf(Date);
    expect(Number.isNaN(restored.invalidDate.getTime())).toBe(true);
    expect(restored.regexp).toBeInstanceOf(RegExp);
    expect(restored.regexp.source).toBe(source.regexp.source);
    expect(restored.regexp.flags).toBe(source.regexp.flags);
    expect(restored.error).toBeInstanceOf(Error);
    expect(restored.error.message).toBe('boom');
    expect(restored.url).toBeInstanceOf(URL);
    expect(restored.url.toString()).toBe('https://example.com/path?q=1');
    expect(restored.params).toBeInstanceOf(URLSearchParams);
    expect(restored.params.toString()).toBe('a=1&b=two');
  });

  it('preserves symbols as values and stable symbol object keys', () => {
    const symbolKey = Symbol.for('stable-key');
    const source = {
      wellKnown: Symbol.iterator,
      global: Symbol.for('role'),
      local: Symbol('local-description'),
      [symbolKey]: 'symbol-key-value',
      [Symbol.toStringTag]: 'TaggedObject',
    };

    const restored = roundTrip(source);

    expect(restored.wellKnown).toBe(Symbol.iterator);
    expect(restored.global).toBe(Symbol.for('role'));
    expect(typeof restored.local).toBe('symbol');
    expect(restored.local.description).toBe('local-description');
    expect(restored[symbolKey]).toBe('symbol-key-value');
    expect(Object.prototype.toString.call(restored)).toBe('[object TaggedObject]');
  });

  it('preserves Map, Set, iterable objects, circular references, and array custom properties', () => {
    const circular: Record<string, unknown> = { name: 'root' };
    circular.self = circular;

    const arrayWithExtra = [1, 2, 3] as number[] & { label?: string };
    arrayWithExtra.label = 'numbers';

    const iterable = {
      *[Symbol.iterator]() {
        yield 'a';
        yield 'b';
      },
    };

    const restored = roundTrip({
      map: new Map<string, unknown>([
        ['one', { value: 1 }],
        ['two', [2]],
      ]),
      set: new Set(['x', 'y']),
      iterable,
      circular,
      arrayWithExtra,
    });

    expect(restored.map).toBeInstanceOf(Map);
    expect(restored.map.get('one')).toEqual({ value: 1 });
    expect(restored.map.get('two')).toEqual([2]);
    expect(restored.set).toBeInstanceOf(Set);
    expect(Array.from(restored.set)).toEqual(['x', 'y']);
    expect(Array.from(restored.iterable)).toEqual(['a', 'b']);
    expect(Array.from(restored.iterable[Symbol.iterator]())).toEqual(['a', 'b']);
    expect(restored.circular.self).toBe(restored.circular);
    expect(Array.from(restored.arrayWithExtra)).toEqual([1, 2, 3]);
    expect(restored.arrayWithExtra.label).toBe('numbers');
  });
});

describe('jsoneo round trips binary values', () => {
  it('preserves ArrayBuffer and DataView bytes', () => {
    const buffer = new Uint8Array([1, 2, 3, 255]).buffer;
    const dataView = new DataView(new Uint8Array([4, 5, 6, 7]).buffer);

    const restored = roundTrip({ buffer, dataView });

    expect(restored.buffer).toBeInstanceOf(ArrayBuffer);
    expect(bytes(restored.buffer)).toEqual([1, 2, 3, 255]);
    expect(restored.dataView).toBeInstanceOf(DataView);
    expect(bytes(restored.dataView)).toEqual([4, 5, 6, 7]);
  });

  it('preserves every available TypedArray constructor', () => {
    const samples = [
      new Int8Array([-1, 2]),
      new Uint8Array([1, 255]),
      new Uint8ClampedArray([-1, 300]),
      new Int16Array([-1234, 2345]),
      new Uint16Array([1234, 65535]),
      new Int32Array([-123456, 234567]),
      new Uint32Array([123456, 4_000_000_000]),
      new Float32Array([1.5, -2.25]),
      new Float64Array([Math.PI, -Math.E]),
      ...(typeof BigInt64Array === 'function' ? [new BigInt64Array([BigInt(-1), BigInt(2)])] : []),
      ...(typeof BigUint64Array === 'function' ? [new BigUint64Array([BigInt(1), BigInt(2)])] : []),
    ];

    for (const sample of samples) {
      const restored = roundTrip(sample) as typeof sample;
      expect(restored.constructor.name).toBe(sample.constructor.name);
      expect(Array.from(restored as unknown as Iterable<unknown>)).toEqual(
        Array.from(sample as unknown as Iterable<unknown>)
      );
    }
  });

  it.runIf(typeof Buffer !== 'undefined')('preserves Buffer in Node.js', () => {
    const restored = roundTrip(Buffer.from([9, 8, 7]));
    expect(Buffer.isBuffer(restored)).toBe(true);
    expect(Array.from(restored)).toEqual([9, 8, 7]);
  });
});

describe('jsoneo round trips functions and callable edge cases', () => {
  it('preserves normal, arrow, async, generator, and async generator functions', async () => {
    function add(a: number, b: number) {
      return a + b;
    }
    const multiply = (a: number, b: number) => a * b;
    async function loadValue() {
      return 'loaded';
    }
    function* numbers() {
      yield 1;
      yield 2;
    }
    async function* asyncNumbers() {
      yield 'a';
      yield 'b';
    }

    const restored = roundTrip({ add, multiply, loadValue, numbers, asyncNumbers });

    expect(restored.add(2, 3)).toBe(5);
    expect(restored.multiply(2, 4)).toBe(8);
    await expect(restored.loadValue()).resolves.toBe('loaded');
    expect(Array.from(restored.numbers())).toEqual([1, 2]);

    const asyncValues: string[] = [];
    for await (const value of restored.asyncNumbers()) {
      asyncValues.push(value);
    }
    expect(asyncValues).toEqual(['a', 'b']);
  });

  it('preserves async generator object methods and computed async iterator methods', async () => {
    const source = {
      async *stream() {
        yield 'first';
        yield 'second';
      },
      async *[Symbol.asyncIterator]() {
        yield 'iterable-first';
        yield 'iterable-second';
      },
    };

    const restored = roundTrip(source);

    const streamValues: string[] = [];
    for await (const value of restored.stream()) {
      streamValues.push(value);
    }
    expect(streamValues).toEqual(['first', 'second']);

    const iterableValues: string[] = [];
    for await (const value of restored) {
      iterableValues.push(value);
    }
    expect(iterableValues).toEqual(['iterable-first', 'iterable-second']);
  });

  it('provides external values through parse closure option', () => {
    const allowedRoles = ['admin', 'editor'];
    const source = {
      canRead(user: { role: string }) {
        return allowedRoles.includes(user.role);
      },
    };

    const restored = parse(stringify(source), { closure: { allowedRoles } }) as typeof source;

    expect(restored.canRead({ role: 'admin' })).toBe(true);
    expect(restored.canRead({ role: 'guest' })).toBe(false);
  });

  it('preserves properties attached to named function objects', () => {
    function canRead(user: { role: string }) {
      return (canRead as typeof canRead & { allowedRoles: string[] }).allowedRoles.includes(user.role);
    }
    (canRead as typeof canRead & { allowedRoles: string[] }).allowedRoles = ['admin', 'editor'];

    const restored = roundTrip({ canRead }) as { canRead: typeof canRead & { allowedRoles: string[] } };

    expect(restored.canRead.allowedRoles).toEqual(['admin', 'editor']);
    expect(restored.canRead({ role: 'editor' })).toBe(true);
    expect(restored.canRead({ role: 'guest' })).toBe(false);
  });

  it('drops native functions that cannot expose reconstructable source code', () => {
    const restored = roundTrip({ nativeFn: Math.max, value: 1 });

    expect(restored.value).toBe(1);
    expect('nativeFn' in restored).toBe(false);
  });
});

describe('jsoneo round trips descriptors, accessors, prototypes, and custom APIs', () => {
  it('preserves non-enumerable, readonly, getter, and setter descriptors', () => {
    const source = { _score: 10 } as {
      _score: number;
      score: number;
      readonly hidden: string;
    };

    function getScore(this: typeof source) {
      return this._score * (getScore as typeof getScore & { factor: number }).factor;
    }
    (getScore as typeof getScore & { factor: number }).factor = 2;

    function setScore(this: typeof source, value: number) {
      this._score = value / (setScore as typeof setScore & { divisor: number }).divisor;
    }
    (setScore as typeof setScore & { divisor: number }).divisor = 2;

    Object.defineProperty(source, 'hidden', {
      value: 'secret',
      enumerable: false,
      writable: false,
      configurable: false,
    });
    Object.defineProperty(source, 'score', {
      get: getScore,
      set: setScore,
      enumerable: true,
      configurable: true,
    });

    const restored = roundTrip(source);
    const hiddenDescriptor = Object.getOwnPropertyDescriptor(restored, 'hidden');
    const scoreDescriptor = Object.getOwnPropertyDescriptor(restored, 'score');

    expect(hiddenDescriptor).toMatchObject({ enumerable: false, writable: false, configurable: false });
    expect(restored.hidden).toBe('secret');
    expect(scoreDescriptor?.enumerable).toBe(true);
    expect(scoreDescriptor?.configurable).toBe(true);
    expect(typeof scoreDescriptor?.get).toBe('function');
    expect(typeof scoreDescriptor?.set).toBe('function');
    expect((scoreDescriptor?.get as typeof getScore & { factor: number }).factor).toBe(2);
    expect((scoreDescriptor?.set as typeof setScore & { divisor: number }).divisor).toBe(2);
    expect(restored.score).toBe(20);
    restored.score = 50;
    expect(restored._score).toBe(25);
    expect(restored.score).toBe(50);
  });

  it('can intentionally flatten descriptors when preserveDescriptors is false', () => {
    const source = {} as { hidden: string };
    Object.defineProperty(source, 'hidden', {
      value: 'visible-after-round-trip',
      enumerable: false,
      writable: false,
      configurable: false,
    });

    const restored = roundTrip(source, { preserveDescriptors: false });
    const descriptor = Object.getOwnPropertyDescriptor(restored, 'hidden');

    expect(restored.hidden).toBe('visible-after-round-trip');
    expect(descriptor).toMatchObject({ enumerable: true, writable: true, configurable: true });
  });

  it('preserves prototype methods and materialized prototype getter values without requiring the original class', () => {
    class Counter {
      count = 1;

      increment(delta = 1) {
        this.count += delta;
        return this.count;
      }

      get double() {
        return this.count * 2;
      }
    }

    const restored = roundTrip(new Counter(), { preserveClassConstructor: false }) as Counter;

    expect(restored).not.toBeInstanceOf(Counter);
    expect(restored.count).toBe(1);
    expect(restored.increment(4)).toBe(5);
    expect(restored.double).toBe(2);
  });

  it('preserves computed well-known symbol methods', () => {
    const restored = roundTrip({
      value: 7,
      [Symbol.toPrimitive]() {
        return this.value;
      },
    });

    expect(+restored).toBe(7);
  });

  it('applies toJSON and fromJSON custom APIs during round trip', () => {
    const source = {
      value: 7,
      toJSON() {
        return { value: this.value };
      },
      fromJSON(json: { value: number }) {
        return { restoredValue: json.value * 2 };
      },
    };

    const restored = roundTrip(source) as unknown as {
      restoredValue: number;
      toJSON: () => unknown;
      fromJSON: () => unknown;
    };

    expect(restored.restoredValue).toBe(14);
    expect(typeof restored.toJSON).toBe('function');
    expect(typeof restored.fromJSON).toBe('function');
  });
});

describe('jsoneo supports optional JSON.rawJSON when the runtime provides it', () => {
  it.runIf(typeof (JSON as typeof JSON & { rawJSON?: unknown }).rawJSON === 'function')(
    'passes JSON.rawJSON values through',
    () => {
      const rawJSON = (JSON as typeof JSON & { rawJSON: (value: string) => unknown }).rawJSON;
      const restored = roundTrip({ raw: rawJSON('1') });

      expect(restored.raw).toBe(1);
    }
  );
});
