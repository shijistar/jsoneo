import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Space } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Primitive Values',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 原始值',
  component: PrimitiveStory,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.primitiveValues'),
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
    preserveDescriptors: {
      control: 'boolean',
      description: storyI18n.t('story.argTypes.preserveDescriptors'),
      table: { category: 'StringifyOptions' },
    },
  },
};

type StoryArgs = {
  input: unknown;
  preserveDescriptors: boolean;
};

function PrimitiveStory(args: StoryArgs) {
  const t = useStoryT();
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
  }, [args.input, args.preserveDescriptors, t]);

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
