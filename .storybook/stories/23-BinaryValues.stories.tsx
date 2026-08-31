import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: '23 Core API / Binary Values',
  parameters: {
    docs: {
      description: {
        component:
          'Binary data types: TypedArrays, ArrayBuffer, DataView. Node.js Buffer support (converted to Uint8Array in browsers).',
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

const BinaryValuesStory = (args: StoryArgs) => {
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = args.input;
      setOriginalValue(value);
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
        <button
          onClick={runSerialization}
          className="sb-copy-button"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            background: '#0969da',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Run stringify → parse
        </button>
      </div>

      {originalValue !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">Original Input</h3>
          <ResultPanel
            label={`Type: ${getTypeSummary(originalValue)}`}
            copyText={formatValue(originalValue)}
            onCopy={() => navigator.clipboard.writeText(formatValue(originalValue))}
          >
            {formatValue(originalValue)}
          </ResultPanel>
        </div>
      )}

      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">Serialized Output (stringify)</h3>
          <ResultPanel
            label={
              <>
                Length: {serialized.length} chars
                <button onClick={() => navigator.clipboard.writeText(serialized)} className="sb-copy-button">
                  Copy
                </button>
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
};

export default {
  ...meta,
  component: BinaryValuesStory,
} as Meta;
type Story = StoryObj<typeof meta>;

export const Uint8ArrayValue: Story = {
  args: { input: { data: new Uint8Array([1, 2, 3, 4, 5]) } },
};

export const Int8ArrayValue: Story = {
  args: { input: { data: new Int8Array([-1, 2, -3, 4]) } },
};

export const Int16ArrayValue: Story = {
  args: { input: { data: new Int16Array([-1234, 2345, -3456]) } },
};

export const Int32ArrayValue: Story = {
  args: { input: { data: new Int32Array([-123456, 234567]) } },
};

export const Float32ArrayValue: Story = {
  args: { input: { data: new Float32Array([1.5, -2.25, 3.14159]) } },
};

export const Float64ArrayValue: Story = {
  args: { input: { data: new Float64Array([Math.PI, -Math.E, 2.71828]) } },
};

export const BigInt64ArrayValue: Story = {
  args: { input: { data: new BigInt64Array([-1n, 2n, -3n]) } },
};

export const BigUint64ArrayValue: Story = {
  args: { input: { data: new BigUint64Array([1n, 2n, 3n]) } },
};

export const ArrayBufferValue: Story = {
  args: { input: { buffer: new ArrayBuffer(16) } },
};

export const DataViewValue: Story = {
  args: { input: { view: new DataView(new ArrayBuffer(8)) } },
};

export const MixedBinaryValues: Story = {
  args: {
    input: {
      uint8: new Uint8Array([1, 2, 3, 4]),
      int8: new Int8Array([-1, 2]),
      int16: new Int16Array([-1234, 2345]),
      int32: new Int32Array([-123456, 234567]),
      float32: new Float32Array([1.5, -2.25]),
      float64: new Float64Array([Math.PI, -Math.E]),
      bigInt64: new BigInt64Array([-1n, 2n]),
      bigUint64: new BigUint64Array([1n, 2n]),
      buffer: new ArrayBuffer(8),
      view: new DataView(new ArrayBuffer(8)),
    },
  },
};
