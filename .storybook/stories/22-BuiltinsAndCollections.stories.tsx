import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Built-ins & Collections',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 内置与集合',
  component: BuiltinsCollectionsStory,
  parameters: {
    docs: {
      description: {
        component: 'Built-in objects and collections: Date, RegExp, URL, URLSearchParams, Map, Set.',
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

function BuiltinsCollectionsStory(args: StoryArgs) {
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

export const DateValue: Story = {
  name: 'Date Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Date 值',
  args: { input: { date: new Date('2026-01-01T00:00:00.000Z') } },
};

export const RegExpValue: Story = {
  name: 'RegExp Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'RegExp 值',
  args: { input: { regexp: /abc/gi } },
};

export const URLValue: Story = {
  name: 'URL Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'URL 值',
  args: { input: { url: new URL('https://example.com?id=123') } },
};

export const URLSearchParamsValue: Story = {
  name: 'URLSearchParams Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'URLSearchParams 值',
  args: { input: { params: new URLSearchParams('id=123&tab=profile') } },
};

export const MapValue: Story = {
  name: 'Map Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Map 值',
  args: {
    input: {
      map: new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
      ]),
    },
  },
};

export const SetValue: Story = {
  name: 'Set Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Set 值',
  args: { input: { set: new Set(['a', 'b', 'c']) } },
};

export const MixedCollections: Story = {
  name: 'Mixed Collections',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合集合',
  args: {
    input: {
      date: new Date('2026-01-01T00:00:00.000Z'),
      regexp: /abc/gi,
      url: new URL('https://example.com?id=123'),
      params: new URLSearchParams('id=123&tab=profile'),
      map: new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
      ]),
      set: new Set(['a', 'b', 'c']),
    },
  },
};
