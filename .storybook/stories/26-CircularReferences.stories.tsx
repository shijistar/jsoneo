import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Circular References',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 循环引用',
  component: CircularReferencesStory,
  parameters: {
    docs: {
      description: {
        component:
          'Circular reference handling. jsoneo tracks circular references during serialization and restores them during parsing.',
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

function CircularReferencesStory(args: StoryArgs) {
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

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

export const SimpleCircular: Story = {
  name: 'Simple Circular',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单循环',
  args: {
    input: (() => {
      const circular: any = { name: 'circular', value: 42 };
      circular.self = circular;
      circular.ref = circular;
      return circular;
    })(),
  },
};

export const CircularArray: Story = {
  name: 'Circular Array',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '循环数组',
  args: {
    input: (() => {
      const arr: any = [1, 2, 3];
      arr.push(arr);
      return arr;
    })(),
  },
};

export const CircularObjectGraph: Story = {
  name: 'Circular Object Graph',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '循环对象图',
  args: {
    input: (() => {
      const a: any = { name: 'a' };
      const b: any = { name: 'b', ref: a };
      a.ref = b;
      return { a, b };
    })(),
  },
};

export const DeepCircular: Story = {
  name: 'Deep Circular',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '深层循环',
  args: {
    input: (() => {
      const root: any = { level: 0 };
      let current = root;
      for (let i = 1; i <= 5; i++) {
        current.next = { level: i, parent: current };
        current = current.next;
      }
      current.next = root; // Create deep circular reference
      return root;
    })(),
  },
};
