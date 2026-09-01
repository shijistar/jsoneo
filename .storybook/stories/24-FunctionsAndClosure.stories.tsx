import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { Button, Select, Space } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { ResultPanel } from '../components/ResultPanel';
import { storyI18n, useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';

const meta: Meta = {
  title: 'Core API / Functions & Closure',
  // @ts-expect-error: because titleCN is an extension field
  titleCN: '核心 API / 函数与闭包',
  component: FunctionsClosureStory,
  parameters: {
    docs: {
      description: {
        component: storyI18n.t('story.meta.functionsClosure'),
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
    closure: {
      control: 'select',
      options: ['', 'allowedRoles'],
      description: storyI18n.t('story.argTypes.closure'),
      table: { category: 'ParseOptions' },
    },
  },
};

type StoryArgs = {
  input?: unknown;
  closure?: string;
};

type FunctionsClosureProps = StoryArgs & { updateArgs: (patch: Partial<StoryArgs>) => void };

function FunctionsClosureStory(args: FunctionsClosureProps) {
  const t = useStoryT();
  const { updateArgs } = args;
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
        const closureObj: Record<string, unknown> | undefined =
          args.closure === 'allowedRoles' ? { allowedRoles: ['admin', 'editor'] } : undefined;
        const parseOpts: ParseOptions = { closure: closureObj, prettyPrint: true };
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
  }, [args.input, args.closure, t]);

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
        <h3 className="sb-section-title">{t('story.common.parseOptions')}</h3>
        <div className="sb-card">
          <div style={{ fontSize: '0.875rem' }}>
            {t('story.functions.closureFixture')}
            <Select
              value={args.closure}
              onChange={(next) => updateArgs({ closure: next })}
              options={[
                { value: '', label: t('story.functions.none') },
                { value: 'allowedRoles', label: t('story.functions.allowedRoles') },
              ]}
              style={{ width: 260, marginLeft: '0.5rem' }}
            />
            <p style={{ margin: '0.5rem 0 0', color: 'var(--storybook-text-muted)' }}>
              {t('story.functions.closureNotice')}
            </p>
          </div>
        </div>
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

// useArgs 只能在 story render 函数（StoryContext）内调用，组件本体保持纯展示。
const renderWithArgs = (storyArgs: StoryArgs) => {
  const [args, updateArgs] = useArgs<StoryArgs>();
  return <FunctionsClosureStory {...args} updateArgs={updateArgs} />;
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularFunction: Story = {
  name: 'Regular Function',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '普通函数',
  render: renderWithArgs,
  args: {
    input: {
      regularFunction: function greet(name: string) {
        return `Hello, ${name}!`;
      },
    },
    closure: '',
  },
};

export const ArrowFunction: Story = {
  name: 'Arrow Function',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '箭头函数',
  render: renderWithArgs,
  args: {
    input: {
      arrowFunction: (x: number) => x * 2,
    },
    closure: '',
  },
};

export const AsyncFunction: Story = {
  name: 'Async Function',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '异步函数',
  render: renderWithArgs,
  args: {
    input: {
      asyncFunction: async () => {
        await Promise.resolve();
        return 'done';
      },
    },
    closure: '',
  },
};

export const GeneratorFunction: Story = {
  name: 'Generator Function',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '生成器函数',
  render: renderWithArgs,
  args: {
    input: {
      generatorFunction: function* numbers() {
        yield 1;
        yield 2;
      },
    },
    closure: '',
  },
};

export const MethodObject: Story = {
  name: 'Method Object',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '方法对象',
  render: renderWithArgs,
  args: {
    input: {
      method: {
        value: 10,
        increment() {
          return ++this.value;
        },
      },
    },
    closure: '',
  },
};

export const FunctionWithClosure: Story = {
  name: 'Function With Closure',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '带闭包函数',
  render: renderWithArgs,
  args: {
    input: (() => {
      function canRead(user: { role: string }) {
        // Uses external `allowedRoles` - must be provided via closure option
        return (canRead as any).allowedRoles?.includes(user.role) ?? false;
      }
      return { canRead };
    })(),
    closure: JSON.stringify({ allowedRoles: ['admin', 'editor'] }, null, 2),
  },
};

export const FunctionWithAttachedProperties: Story = {
  name: 'Function With Attached Properties',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '带附加属性函数',
  render: renderWithArgs,
  args: {
    input: (() => {
      function getConfig() {
        return (getConfig as any).defaults;
      }
      return { getConfig };
    })(),
    closure: '',
  },
};

export const MixedFunctions: Story = {
  name: 'Mixed Functions',
  // @ts-expect-error: because nameCN is an extension field
  nameCN: '混合函数',
  render: renderWithArgs,
  args: {
    input: {
      regular: function add(a: number, b: number) {
        return a + b;
      },
      arrow: (x: number) => x * 2,
      async: async () => 'async result',
      generator: function* gen() {
        yield 1;
        yield 2;
      },
      method: {
        count: 0,
        increment() {
          return ++this.count;
        },
      },
    },
    closure: '',
  },
};
