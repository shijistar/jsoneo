import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: '90 Security / Boundary',
  parameters: {
    docs: {
      description: {
        component:
          'Security boundary demonstration. jsoneo.parse() executes generated JavaScript code. This page shows the correct and incorrect ways to use jsoneo, and why you must only parse trusted data.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: { disable: true },
      description: 'Fixed trusted fixture (not editable in this demo)',
      table: { category: 'Input' },
    },
  },
};

type StoryArgs = { input: unknown };

const SecurityBoundaryStory = (args: StoryArgs) => {
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
      <TrustedInputNotice
        variant="warning"
        children={
          <>
            <strong>jsoneo.parse() executes generated JavaScript code.</strong> Only parse data produced by
            jsoneo.stringify() from trusted sources. Never parse untrusted user input, network data from untrusted
            sources, or arbitrary strings. jsoneo is NOT a sandbox or security boundary. For untrusted data exchange,
            use native JSON or other data-only formats.
          </>
        }
      />

      <div className="sb-section">
        <h3 className="sb-section-title">✅ Correct Usage: Trusted Data Round-trip</h3>
        <ResultPanel
          label="This is the intended usage pattern"
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
          Run stringify → parse (Trusted Fixture)
        </button>
      </div>

      {originalValue !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">Original Input (Trusted)</h3>
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
          <h3 className="sb-section-title">Serialized Output (from jsoneo.stringify)</h3>
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

      <div className="sb-section">
        <h3 className="sb-section-title">❌ Incorrect Usage: Never Parse Untrusted Data</h3>
        <ResultPanel variant="error" label="DANGER: Do not do this!">
          <pre className="sb-json-output">
            {`// NEVER do this:
const userInput = getUserInputFromNetwork(); // Untrusted!
const result = parse(userInput); // EXECUTES ARBITRARY CODE

// NEVER do this either:
const arbitraryString = '{"malicious": "code"}';
const result = parse(arbitraryString); // EXECUTES ARBITRARY CODE`}
          </pre>
        </ResultPanel>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Security Rules</h3>
        <ResultPanel>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>
              Only parse data produced by <code>jsoneo.stringify()</code>
            </li>
            <li>Only parse data from trusted sources (your own application, controlled test fixtures)</li>
            <li>Never parse user input, API responses from untrusted services, or arbitrary strings</li>
            <li>
              jsoneo is NOT a sandbox — it uses <code>new Function()</code> to evaluate generated code
            </li>
            <li>
              For untrusted data exchange, use native <code>JSON.parse()</code> or other data-only formats
            </li>
            <li>If you must parse external data, validate/sanitize it first and understand the risks</li>
          </ul>
        </ResultPanel>
      </div>
    </div>
  );
};

export default {
  ...meta,
  component: SecurityBoundaryStory,
} as Meta;
type Story = StoryObj<typeof meta>;

export const TrustedRoundTrip: Story = {
  args: {
    input: {
      user: {
        id: Symbol.for('user.id'),
        name: 'John',
        permissions: new Set(['read', 'write']),
        greet() {
          return `Hi, ${this.name}`;
        },
      },
      settings: { theme: 'dark' },
    },
  },
};

export const ComplexTrustedObject: Story = {
  args: {
    input: (() => {
      const obj: any = {
        string: 'test',
        number: 42,
        date: new Date(),
        regexp: /abc/gi,
        map: new Map([['key', 'value']]),
        set: new Set(['a', 'b']),
        func: function () {
          return 'hello';
        },
      };
      obj.self = obj;
      return obj;
    })(),
  },
};
