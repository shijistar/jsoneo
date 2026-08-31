import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Compatibility / Runtime Environments',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '兼容性 / 运行时环境',
  component: CompatibilityStory,
  parameters: {
    docs: {
      description: {
        component:
          'Browser and Node.js compatibility. Shows which features are available in each environment and how jsoneo handles differences.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: 'object',
      description: 'Input value to serialize',
      table: { category: 'Input' },
    },
  },
};

type StoryArgs = { input: unknown };

function CompatibilityStory(args: StoryArgs) {
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const isNode = typeof process !== 'undefined' && process.versions?.node;
  const hasBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer;
  const hasBigIntTypedArrays = typeof BigInt64Array !== 'undefined';

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = args.input;
      const stringifyOpts: StringifyOptions = {};
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const parseOpts: ParseOptions = { prettyPrint: true };
        const restoredValue = parse(serializedResult, parseOpts);
        setRestored(restoredValue);
        const rt = checkRoundTrip(value, restoredValue);
        setRoundTripResult(rt);
      } catch (parseError) {
        setError(`Parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setRestored(null);
        setRoundTripResult({ passed: false, reason: 'Parse error' });
      }
    } catch (stringifyError) {
      setError(
        `Stringify failed: ${stringifyError instanceof Error ? stringifyError.message : String(stringifyError)}`,
      );
      setSerialized('');
      setRestored(null);
      setRoundTripResult(null);
    }
  }, [args.input]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="info" />

      <div className="sb-section">
        <h3 className="sb-section-title">Runtime Environment</h3>
        <ResultPanel
          label="Environment Detection"
          copyText={JSON.stringify({ isNode, hasBuffer, hasBigIntTypedArrays }, null, 2)}
          onCopy={() =>
            navigator.clipboard.writeText(JSON.stringify({ isNode, hasBuffer, hasBigIntTypedArrays }, null, 2))
          }
        >
          <pre className="sb-json-output">{JSON.stringify({ isNode, hasBuffer, hasBigIntTypedArrays }, null, 2)}</pre>
        </ResultPanel>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Test Input</h3>
        <ResultPanel
          label={`Type: ${getTypeSummary(args.input)}`}
          copyText={formatValue(args.input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(args.input))}
        >
          {formatValue(args.input)}
        </ResultPanel>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Actions</h3>
        <Button type="primary" onClick={runSerialization}>
          Run stringify → parse
        </Button>
      </div>

      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">Serialized Output (stringify)</h3>
          <ResultPanel
            label={
              <>
                Length: {serialized.length} chars
                <Button size="small" onClick={() => navigator.clipboard.writeText(serialized)}>
                  Copy
                </Button>
              </>
            }
          >
            <pre className="sb-json-output sb-expandable">{serialized}</pre>
          </ResultPanel>
        </div>
      )}

      {error && (
        <div className="sb-section">
          <h3 className="sb-section-title">Error</h3>
          <ResultPanel variant="error" label={error} />
        </div>
      )}

      {restored !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">Restored Result (parse)</h3>
          <ResultPanel
            label={
              <>
                Type: {getTypeSummary(restored)}
                {roundTripResult && (
                  <>
                    <span className={`sb-badge ${roundTripResult.passed ? 'success' : 'danger'}`}>
                      {roundTripResult.passed ? '✓ Round-trip OK' : '✗ Round-trip FAIL'}
                    </span>
                    <span className="sb-badge warning">{roundTripResult.reason}</span>
                  </>
                )}
              </>
            }
          >
            {formatValue(restored)}
          </ResultPanel>
        </div>
      )}
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

export const BufferSupport: Story = {
  name: 'Buffer Support',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Buffer 支持',
  args: {
    input: (() => {
      if (typeof Buffer !== 'undefined') {
        return { buffer: Buffer.from('hello world') };
      }
      return { buffer: new Uint8Array([104, 101, 108, 108, 111]) };
    })(),
  },
};

export const BigIntTypedArrays: Story = {
  name: 'BigInt Typed Arrays',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigInt 类型化数组',
  args: {
    input: {
      bigInt64: new BigInt64Array([-1n, 2n, -3n]),
      bigUint64: new BigUint64Array([1n, 2n, 3n]),
    },
  },
};

export const CrossEnvironmentObject: Story = {
  name: 'Cross Environment Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '跨环境对象',
  args: {
    input: {
      string: 'test',
      number: 42,
      date: new Date('2026-01-01T00:00:00.000Z'),
      regexp: /test/gi,
      map: new Map([['key', 'value']]),
      set: new Set(['a', 'b']),
      typedArray: new Uint8Array([1, 2, 3]),
      arrayBuffer: new ArrayBuffer(8),
      dataView: new DataView(new ArrayBuffer(8)),
    },
  },
};

export const SymbolSupport: Story = {
  name: 'Symbol Support',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Symbol 支持',
  args: {
    input: {
      globalSymbol: Symbol.for('global.key'),
      localSymbol: Symbol('local'),
      wellKnownSymbol: Symbol.iterator,
      symbolKeyed: {
        [Symbol.for('metadata')]: 'value',
      },
    },
  },
};

export const ErrorObject: Story = {
  name: 'Error Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Error 对象',
  args: {
    input: {
      error: new Error('Test error'),
      typeError: new TypeError('Type error'),
      rangeError: new RangeError('Range error'),
    },
  },
};

export const IterablesAndGenerators: Story = {
  name: 'Iterables And Generators',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '可迭代与生成器',
  args: {
    input: {
      // generator: (function* () {
      //   yield 1;
      //   yield 2;
      // })(),
      iterable: {
        *[Symbol.iterator]() {
          yield 'a';
          yield 'b';
        },
      },
    },
  },
};
