import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: '30 Core API / Options',
  parameters: {
    docs: {
      description: {
        component:
          'StringifyOptions and ParseOptions demonstration. Shows how options affect serialization and deserialization behavior.',
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
    startTag: {
      control: 'text',
      description: 'Start token for serialized string',
      table: { category: 'StringifyOptions' },
    },
    endTag: {
      control: 'text',
      description: 'End token for serialized string',
      table: { category: 'StringifyOptions' },
    },
    variablePrefix: {
      control: 'text',
      description: 'Prefix for generated variable names',
      table: { category: 'StringifyOptions' },
    },
    preserveClassConstructor: {
      control: 'boolean',
      description: 'Preserve class constructor code during serialization',
      table: { category: 'StringifyOptions' },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: 'Preserve custom property descriptors',
      table: { category: 'StringifyOptions' },
    },
    debug: {
      control: 'boolean',
      description: 'Print debug information',
      table: { category: 'Options' },
    },
    prettyPrint: {
      control: 'boolean',
      description: 'Pretty print deserialized code',
      table: { category: 'ParseOptions' },
    },
  },
};

type StoryArgs = {
  input: unknown;
  startTag: string;
  endTag: string;
  variablePrefix: string;
  preserveClassConstructor: boolean;
  preserveDescriptors: boolean;
  debug: boolean;
  prettyPrint: boolean;
};

const OptionsStory = (args: StoryArgs) => {
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
      const stringifyOpts: StringifyOptions = {
        startTag: args.startTag || undefined,
        endTag: args.endTag || undefined,
        variablePrefix: args.variablePrefix || undefined,
        preserveClassConstructor: args.preserveClassConstructor,
        preserveDescriptors: args.preserveDescriptors,
        debug: args.debug,
      };
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const parseOpts: ParseOptions = {
          prettyPrint: args.prettyPrint,
          debug: args.debug,
        };
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
  }, [
    args.input,
    args.startTag,
    args.endTag,
    args.variablePrefix,
    args.preserveClassConstructor,
    args.preserveDescriptors,
    args.debug,
    args.prettyPrint,
  ]);

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
        <h3 className="sb-section-title">Stringify Options</h3>
        <div className="sb-grid">
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              startTag:{' '}
              <input
                type="text"
                value={args.startTag}
                disabled
                placeholder="\$SJS\$_"
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  fontFamily: 'var(--storybook-code-font-family)',
                  fontSize: '0.8125rem',
                }}
              />
            </label>
          </div>
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              endTag:{' '}
              <input
                type="text"
                value={args.endTag}
                disabled
                placeholder="_\$SJE\$"
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  fontFamily: 'var(--storybook-code-font-family)',
                  fontSize: '0.8125rem',
                }}
              />
            </label>
          </div>
          <div className="sb-card">
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              variablePrefix:{' '}
              <input
                type="text"
                value={args.variablePrefix}
                disabled
                placeholder="\$SJV\$_"
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  fontFamily: 'var(--storybook-code-font-family)',
                  fontSize: '0.8125rem',
                }}
              />
            </label>
          </div>
        </div>
        <div className="sb-grid" style={{ marginTop: '0.5rem' }}>
          <label className="sb-card" style={{ cursor: 'default' }}>
            <input type="checkbox" disabled checked={args.preserveClassConstructor} />
            <span>preserveClassConstructor ({String(args.preserveClassConstructor)})</span>
          </label>
          <label className="sb-card" style={{ cursor: 'default' }}>
            <input type="checkbox" disabled checked={args.preserveDescriptors} />
            <span>preserveDescriptors ({String(args.preserveDescriptors)})</span>
          </label>
          <label className="sb-card" style={{ cursor: 'default' }}>
            <input type="checkbox" disabled checked={args.debug} />
            <span>debug ({String(args.debug)})</span>
          </label>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Parse Options</h3>
        <div className="sb-grid">
          <label className="sb-card" style={{ cursor: 'default' }}>
            <input type="checkbox" disabled checked={args.prettyPrint} />
            <span>prettyPrint ({String(args.prettyPrint)})</span>
          </label>
        </div>
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
  component: OptionsStory,
} as Meta;
type Story = StoryObj<typeof meta>;

export const DefaultOptions: Story = {
  args: {
    input: { value: 42, nested: { a: 1 } },
    startTag: '',
    endTag: '',
    variablePrefix: '',
    preserveClassConstructor: false,
    preserveDescriptors: true,
    debug: false,
    prettyPrint: true,
  },
};

export const CustomTags: Story = {
  args: {
    input: { value: 'test', number: 123 },
    startTag: '<<START>>',
    endTag: '<<END>>',
    variablePrefix: '<<VAR>>',
    preserveClassConstructor: false,
    preserveDescriptors: true,
    debug: false,
    prettyPrint: true,
  },
};

export const DebugMode: Story = {
  args: {
    input: { complex: { nested: { deep: 'value' } }, array: [1, 2, 3] },
    startTag: '',
    endTag: '',
    variablePrefix: '',
    preserveClassConstructor: false,
    preserveDescriptors: true,
    debug: true,
    prettyPrint: true,
  },
};

export const PreserveDescriptorsDisabled: Story = {
  args: {
    input: (() => {
      const obj = { value: 1 };
      Object.defineProperties(obj, {
        readonly: { value: 'constant', writable: false, enumerable: true },
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
      return { obj };
    })(),
    startTag: '',
    endTag: '',
    variablePrefix: '',
    preserveClassConstructor: false,
    preserveDescriptors: false,
    debug: false,
    prettyPrint: true,
  },
};

export const PrettyPrintDisabled: Story = {
  args: {
    input: { a: { b: { c: { d: 'deep' } } }, list: [1, 2, 3, 4, 5] },
    startTag: '',
    endTag: '',
    variablePrefix: '',
    preserveClassConstructor: false,
    preserveDescriptors: true,
    debug: false,
    prettyPrint: false,
  },
};
