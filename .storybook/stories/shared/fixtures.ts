// Fixture type mapping - matches the fixture selector in Workbench
export const FIXTURE_TYPES = [
  'primitives',
  'special-values',
  'builtins-collections',
  'binary-values',
  'functions-closure',
  'descriptors-prototype',
  'circular-references',
  'complex-object',
] as const;

export const FIXTURE_LABELS: Record<string, string> = {
  primitives: 'Primitives (string, number, boolean, null, array, object)',
  'special-values': 'Special Values (undefined, NaN, Infinity, -0, BigInt)',
  'builtins-collections': 'Built-ins & Collections (Date, RegExp, URL, Map, Set)',
  'binary-values': 'Binary Values (TypedArrays, ArrayBuffer, DataView)',
  'functions-closure': 'Functions & Closure',
  'descriptors-prototype': 'Descriptors & Prototype',
  'circular-references': 'Circular References',
  'complex-object': 'Complex Object',
};

export function createFixture(type: string): unknown {
  switch (type) {
    case 'primitives':
      return {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { a: 1, b: 'two', c: [true, false] },
      };
    case 'special-values':
      return {
        undefined: undefined,
        NaN: NaN,
        Infinity: Infinity,
        negativeInfinity: -Infinity,
        negativeZero: -0,
        bigInt: 9007199254740991n,
      };
    case 'builtins-collections':
      return {
        date: new Date('2026-01-01T00:00:00.000Z'),
        regexp: /abc/gi,
        url: new URL('https://example.com?id=123'),
        urlSearchParams: new URLSearchParams('id=123&tab=profile'),
        map: new Map<string, unknown>([
          ['key1', 'value1'],
          ['key2', { nested: true }],
        ]),
        set: new Set(['a', 'b', 'c']),
      };
    case 'binary-values':
      return {
        uint8Array: new Uint8Array([1, 2, 3, 4]),
        int8Array: new Int8Array([-1, 2]),
        int16Array: new Int16Array([-1234, 2345]),
        int32Array: new Int32Array([-123456, 234567]),
        float32Array: new Float32Array([1.5, -2.25]),
        float64Array: new Float64Array([Math.PI, -Math.E]),
        bigInt64Array: new BigInt64Array([-1n, 2n]),
        bigUint64Array: new BigUint64Array([1n, 2n]),
        arrayBuffer: new ArrayBuffer(8),
        dataView: new DataView(new ArrayBuffer(8)),
      };
    case 'functions-closure':
      return {
        regularFunction: function greet(name: string) {
          return `Hello, ${name}!`;
        },
        arrowFunction: (x: number) => x * 2,
        asyncFunction: async () => {
          await Promise.resolve();
          return 'done';
        },
        generatorFunction: function* numbers() {
          yield 1;
          yield 2;
        },
        method: {
          value: 10,
          increment() {
            return ++this.value;
          },
        },
      };
    case 'descriptors-prototype':
      const obj = { value: 1 };
      Object.defineProperties(obj, {
        readonly: { value: 'constant', writable: false, enumerable: true },
        nonEnumerable: { value: 'hidden', writable: true, enumerable: false },
        accessor: {
          get() {
            return this.value;
          },
          set(v: number) {
            this.value = v;
          },
          enumerable: true,
        },
      });
      const parent = {
        parentMethod() {
          return 'parent';
        },
      };
      const child = Object.create(parent);
      child.childMethod = () => 'child';
      return { descriptors: obj, prototype: child };
    case 'circular-references':
      const circular: any = { name: 'circular', value: 42 };
      circular.self = circular;
      circular.ref = circular;
      return circular;
    case 'complex-object':
      return {
        user: {
          id: Symbol.for('user.id'),
          name: 'John',
          tags: ['dev', 'js'],
          metadata: new Map<string, unknown>([
            ['created', new Date()],
            ['active', true],
          ]),
          permissions: new Set(['read', 'write']),
          greet() {
            return `Hi, ${this.name}`;
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };
    default:
      return {};
  }
}
