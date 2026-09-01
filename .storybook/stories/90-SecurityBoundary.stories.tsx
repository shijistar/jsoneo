import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Space } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { TrustedInputNotice } from '../components/TrustedInputNotice';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Security Concern / Security Boundary',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '安全性 / 安全边界',
  component: SecurityBoundaryStory,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.securityBoundary'),
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: { disable: true },
      description: storyI18n.t('story.argTypes.fixedFixture'),
      table: { category: 'Input' },
    },
  },
};

type StoryArgs = { input: unknown };

function SecurityBoundaryStory(args: StoryArgs) {
  const t = useStoryT();
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
        setError(
          t('story.common.parseFailed', {
            message: parseError instanceof Error ? parseError.message : String(parseError),
          }),
        );
        setRestored(null);
        setRoundTripResult({ passed: false, reason: t('story.common.parseError') });
      }
    } catch (stringifyError) {
      setError(
        t('story.common.stringifyFailed', {
          message: stringifyError instanceof Error ? stringifyError.message : String(stringifyError),
        }),
      );
      setSerialized('');
      setRestored(null);
      setRoundTripResult(null);
    }
  }, [args.input, t]);

  return (
    <div className="sb-story-container">
      <TrustedInputNotice variant="warning" children={<>{t('story.security.detailedNotice')}</>} />
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.security.correctUsage')}</h3>
        <ResultPanel
          label={t('story.security.intendedUsage')}
          copyText={formatValue(args.input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(args.input))}
        >
          {formatValue(args.input)}
        </ResultPanel>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.actions')}</h3>
        <Button type="primary" onClick={runSerialization}>
          {t('story.security.runTrusted')}
        </Button>
      </div>
      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.security.serializedFrom')}</h3>
          <ResultPanel
            label={
              <Space>
                {t('story.common.lengthLabel', { count: serialized.length })}
                <Button size="small" onClick={() => navigator.clipboard.writeText(serialized)}>
                  {t('story.common.copy')}
                </Button>
              </Space>
            }
          >
            <pre className="sb-json-output sb-expandable">{serialized}</pre>
          </ResultPanel>
        </div>
      )}
      {error && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.error')}</h3>
          <ResultPanel variant="error" label={error} />
        </div>
      )}
      {restored !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.restoredResult')}</h3>
          <ResultPanel
            label={
              <>
                {t('story.common.typeLabel', { type: getTypeSummary(restored) })}
                {roundTripResult && (
                  <>
                    <span className={`sb-badge ${roundTripResult.passed ? 'success' : 'danger'}`}>
                      {roundTripResult.passed ? t('story.common.roundTripOk') : t('story.common.roundTripFail')}
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
        <h3 className="sb-section-title">{t('story.security.incorrectUsage')}</h3>
        <ResultPanel variant="error" label={t('story.security.danger')}>
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
        <h3 className="sb-section-title">{t('story.security.securityRules')}</h3>
        <ResultPanel label="">
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>{t('story.security.rule1')}</li>
            <li>{t('story.security.rule2')}</li>
            <li>{t('story.security.rule3')}</li>
            <li>{t('story.security.rule4')}</li>
            <li>{t('story.security.rule5')}</li>
            <li>{t('story.security.rule6')}</li>
          </ul>
        </ResultPanel>
      </div>
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

export const TrustedRoundTrip: Story = {
  name: 'Trusted Round Trip',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '可信往返',
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
  name: 'Complex Trusted Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '复杂可信对象',
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
