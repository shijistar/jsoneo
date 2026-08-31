import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Primitive Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 原始值',
  component: PrimitiveStory,
  parameters: {
    docs: {
      description: {
        component: 'JSON-compatible primitives: string, number, boolean, null, array, plain object.',
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
    preserveDescriptors: {
      control: 'boolean',
      description: 'Whether to preserve custom property descriptors',
      table: { category: 'StringifyOptions' },
    },
  },
};

type StoryArgs = {
  input: unknown;
  preserveDescriptors: boolean;
};

function PrimitiveStory(args: StoryArgs) {
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = args.input;
      const stringifyOpts: StringifyOptions = {
        preserveDescriptors: args.preserveDescriptors,
      };
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
  }, [args.input, args.preserveDescriptors]);

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

const basePrimitive = {
  string: 'hello world',
  number: 42,
  boolean: true,
  null: null,
  array: [1, 'two', true, null],
  object: { a: 1, b: 'two', c: [true, false], nested: { x: 100 } },
};

export const AllPrimitives: Story = {
  name: 'All Primitives',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '全部原始值',
  args: {
    input: basePrimitive,
    preserveDescriptors: true,
  },
};

export const SimpleString: Story = {
  name: 'Simple String',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单字符串',
  args: {
    input: 'simple string',
    preserveDescriptors: true,
  },
};

export const SimpleNumber: Story = {
  name: 'Simple Number',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单数字',
  args: {
    input: 123.456,
    preserveDescriptors: true,
  },
};

export const SimpleBoolean: Story = {
  name: 'Simple Boolean',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单布尔',
  args: {
    input: true,
    preserveDescriptors: true,
  },
};

export const SimpleArray: Story = {
  name: 'Simple Array',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '简单数组',
  args: {
    input: [1, 2, 3, 'four', true, null],
    preserveDescriptors: true,
  },
};

export const NestedObject: Story = {
  name: 'Nested Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '嵌套对象',
  args: {
    input: { level1: { level2: { level3: 'deep' } }, array: [{ a: 1 }, { b: 2 }] },
    preserveDescriptors: true,
  },
};
