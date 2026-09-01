import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Space } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Special Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 特殊值',
  component: SpecialValuesStory,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.specialValues'),
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    input: {
      control: 'object',
      description: storyI18n.t('story.argTypes.input'),
      table: { category: 'Input' },
    },
  },
};

type StoryArgs = { input: unknown };

function SpecialValuesStory(args: StoryArgs) {
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
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.testInput')}</h3>
        <ResultPanel
          label={t('story.common.typeLabel', { type: getTypeSummary(args.input) })}
          copyText={formatValue(args.input)}
          onCopy={() => navigator.clipboard.writeText(formatValue(args.input))}
        >
          {formatValue(args.input)}
        </ResultPanel>
      </div>
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.actions')}</h3>
        <Button type="primary" onClick={runSerialization}>
          {t('story.common.runStringifyParse')}
        </Button>
      </div>
      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.serializedOutput')}</h3>
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
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

export const UndefinedValue: Story = {
  name: 'Undefined Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'Undefined 值',
  args: { input: { value: undefined } },
};

export const NaNValue: Story = {
  name: 'NaN Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'NaN 值',
  args: { input: { value: NaN } },
};

export const PositiveInfinity: Story = {
  name: 'Positive Infinity',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '正无穷大',
  args: { input: { value: Infinity } },
};

export const NegativeInfinity: Story = {
  name: 'Negative Infinity',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '负无穷大',
  args: { input: { value: -Infinity } },
};

export const NegativeZero: Story = {
  name: 'Negative Zero',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '负零',
  args: { input: { value: -0 } },
};

export const BigIntValue: Story = {
  name: 'BigInt Value',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: 'BigInt 值',
  args: { input: { value: 9007199254740991n } },
};

export const MixedSpecialValues: Story = {
  name: 'Mixed Special Values',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合特殊值',
  args: {
    input: {
      undefined: undefined,
      NaN: NaN,
      Infinity: Infinity,
      negativeInfinity: -Infinity,
      negativeZero: -0,
      bigInt: 12345678901234567890n,
    },
  },
};
