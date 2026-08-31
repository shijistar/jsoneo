import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';
import { createFixture, FIXTURE_TYPES, type FixtureType } from './shared/fixtures';

const meta: Meta = {
  title: '10 Workbench / Playground',
  parameters: {
    docs: {
      description: {
        component:
          'Interactive playground for `jsoneo.stringify()` and `jsoneo.parse()`. Select a fixture or use the custom value to see real serialization and round-trip results.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fixture: {
      control: 'select',
      options: FIXTURE_TYPES,
      description: 'Predefined fixture to serialize/parse',
      table: {
        category: 'Input',
      },
    },
    preserveDescriptors: {
      control: 'boolean',
      description: 'Whether to preserve custom property descriptors',
      table: {
        category: 'StringifyOptions',
      },
    },
    debug: {
      control: 'boolean',
      description: 'Print debug information during serialization/deserialization',
      table: {
        category: 'Options',
      },
    },
    closure: {
      control: 'select',
      options: ['', 'allowedRoles'],
      description: 'Select a predefined trusted closure fixture for parse',
      table: {
        category: 'ParseOptions',
      },
    },
  },
};

const WorkbenchStory = (args: {
  fixture: FixtureType;
  preserveDescriptors: boolean;
  debug: boolean;
  closure: string;
}) => {
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = createFixture(args.fixture);
      setOriginalValue(value);
      const stringifyOpts: StringifyOptions = {
        preserveDescriptors: args.preserveDescriptors,
        debug: args.debug,
      };
      const serializedResult = stringify(value, stringifyOpts);
      setSerialized(serializedResult);
      try {
        const closureObj: Record<string, unknown> | undefined =
          args.closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
        const parseOpts: ParseOptions = {
          closure: closureObj,
          debug: args.debug,
          prettyPrint: true,
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
  }, [args.fixture, args.preserveDescriptors, args.debug, args.closure]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice />

      <div className="sb-section">
        <h3 className="sb-section-title">Fixture Selection</h3>
        <div className="sb-grid">
          <div className="sb-card">
            <div className="sb-card-title">Input Fixture</div>
            <select
              value={args.fixture}
              disabled
              className="sb-copy-button"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
            >
              {FIXTURE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sb-section">
        <h3 className="sb-section-title">Stringify Options</h3>
        <div className="sb-grid">
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
        <div className="sb-card">
          <div style={{ fontSize: '0.875rem' }}>
            Closure fixture: {args.closure === 'allowedRoles' ? 'allowedRoles = [admin, editor]' : 'none'}
            <p style={{ margin: '0.5rem 0 0', color: 'var(--storybook-text-muted)' }}>
              Choose a trusted fixture from the Controls panel; arbitrary closure input is intentionally unavailable.
            </p>
          </div>
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

export default meta;
type Story = StoryObj<typeof meta>;

export const Workbench: Story = {
  args: {
    fixture: 'primitives',
    preserveDescriptors: true,
    debug: false,
    closure: '',
  },
};
