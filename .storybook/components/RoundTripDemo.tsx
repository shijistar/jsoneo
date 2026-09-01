import { useCallback, useMemo, useState } from 'react';
import { Button, Space } from 'antd';
import { parse, stringify } from '../../src';
import type { ParseOptions, StringifyOptions } from '../../src/types';
import { useStoryT } from '../locales';
import { checkRoundTrip, formatValue, getTypeSummary } from '../utils/roundTrip';
import { ResultPanel } from './ResultPanel';

interface RoundTripDemoProps {
  /** 待序列化的输入值 */
  input: unknown;
  /** stringify 选项，默认 {} */
  stringifyOptions?: StringifyOptions;
  /** parse 选项，默认 { prettyPrint: true } */
  parseOptions?: ParseOptions;
  /** 插入在 Test Input 和 Actions 之间的自定义选项面板 */
  optionsPanel?: React.ReactNode;
  /** 插入在 Test Input 之前的自定义内容（如环境检测） */
  beforeInput?: React.ReactNode;
  /** 是否在运行后展示 Original Input 面板（默认 false） */
  showOriginalInput?: boolean;
}

/**
 * 通用的 stringify → parse 往返演示组件。 封装了序列化/反序列化逻辑、错误处理、round-trip 校验以及结果展示 UI， 各 story 只需传入 input 和可选的
 * options/自定义面板即可。
 */
export function RoundTripDemo({
  input,
  stringifyOptions,
  parseOptions,
  optionsPanel,
  beforeInput,
  showOriginalInput = false,
}: RoundTripDemoProps) {
  const t = useStoryT();
  const [originalValue, setOriginalValue] = useState<unknown>(null);
  const [serialized, setSerialized] = useState<string>('');
  const [restored, setRestored] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const runSerialization = useCallback(() => {
    setError(null);
    try {
      const value = input;
      if (showOriginalInput) setOriginalValue(value);
      const serializedResult = stringify(value, stringifyOptions ?? {});
      setSerialized(serializedResult);
      try {
        const restoredValue = parse(serializedResult, parseOptions ?? { prettyPrint: true });
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
  }, [input, stringifyOptions, parseOptions, t, showOriginalInput]);

  const inputText = useMemo(() => formatValue(input), [input]);

  return (
    <div className="sb-story-container">
      {beforeInput}
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.testInput')}</h3>
        <ResultPanel
          label={t('story.common.typeLabel', { type: getTypeSummary(input) })}
          copyText={inputText}
          onCopy={() => navigator.clipboard.writeText(inputText)}
        >
          {inputText}
        </ResultPanel>
      </div>
      {optionsPanel}
      <div className="sb-section">
        <h3 className="sb-section-title">{t('story.common.actions')}</h3>
        <Button type="primary" onClick={runSerialization}>
          {t('story.common.runStringifyParse')}
        </Button>
      </div>
      {showOriginalInput && originalValue !== null && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.options.originalInput')}</h3>
          <ResultPanel
            label={t('story.common.typeLabel', { type: getTypeSummary(originalValue) })}
            copyText={formatValue(originalValue)}
            onCopy={() => navigator.clipboard.writeText(formatValue(originalValue))}
          >
            {formatValue(originalValue)}
          </ResultPanel>
        </div>
      )}
      {serialized && (
        <div className="sb-section">
          <h3 className="sb-section-title">{t('story.common.serializedOutput')}</h3>
          <ResultPanel
            label={<Space>{t('story.common.lengthLabel', { count: serialized.length })}</Space>}
            copyText={serialized}
            onCopy={() => navigator.clipboard.writeText(serialized)}
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
              <Space>
                {t('story.common.typeLabel', { type: getTypeSummary(restored) })}
                {roundTripResult && (
                  <>
                    <span className={`sb-badge ${roundTripResult.passed ? 'success' : 'danger'}`}>
                      {roundTripResult.passed ? t('story.common.roundTripOk') : t('story.common.roundTripFail')}
                    </span>
                    <span className="sb-badge warning">{roundTripResult.reason}</span>
                  </>
                )}
              </Space>
            }
          >
            {formatValue(restored)}
          </ResultPanel>
        </div>
      )}
    </div>
  );
}
