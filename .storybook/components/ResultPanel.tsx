import SyntaxHighlighter from 'react-syntax-highlighter';
import { irBlack, vs } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Button } from 'antd';
import { useStoryT } from '../locales';

interface ResultPanelProps {
  label: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
  badge?: { text: string; variant: 'success' | 'warning' | 'danger' };
  copyText?: string;
  onCopy?: () => void;
}

export const ResultPanel = ({ label, children, variant = 'default', badge, copyText, onCopy }: ResultPanelProps) => {
  const t = useStoryT();
  const isDark = document.documentElement.classList.contains('dark');

  const bgColors = {
    default: isDark ? '#161b22' : '#f6f8fa',
    error: '#ffdce0',
    success: '#dafbe1',
  };
  const borderColors = {
    default: '#d0d7de',
    error: '#cf222e',
    success: '#86efac',
  };
  const labelColors = {
    default: isDark ? '#e6edf3' : '#24292e',
    error: '#cf222e',
    success: '#1a7f37',
  };

  return (
    <div
      className="sb-result-panel"
      style={
        {
          background: bgColors[variant],
          borderColor: borderColors[variant],
        } as React.CSSProperties
      }
    >
      <div
        className="sb-result-label"
        style={
          {
            color: labelColors[variant],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          } as React.CSSProperties
        }
      >
        <span>{label}</span>
        {badge && (
          <span
            className={`sb-badge ${badge.variant}`}
            style={
              {
                background:
                  badge.variant === 'success'
                    ? isDark
                      ? '#1a7f37'
                      : '#dafbe1'
                    : badge.variant === 'warning'
                      ? isDark
                        ? '#9a6700'
                        : '#fff8c5'
                      : isDark
                        ? '#cf222e'
                        : '#ffdce0',
                color:
                  badge.variant === 'success'
                    ? isDark
                      ? '#dafbe1'
                      : '#1a7f37'
                    : badge.variant === 'warning'
                      ? isDark
                        ? '#fff8c5'
                        : '#9a6700'
                      : isDark
                        ? '#ffdce0'
                        : '#cf222e',
              } as React.CSSProperties
            }
          >
            {badge.text}
          </span>
        )}
        {copyText && onCopy && (
          <Button size="small" onClick={onCopy}>
            {t('story.common.copy')}
          </Button>
        )}
      </div>
      {typeof children === 'string' ? (
        <SyntaxHighlighter language="javascript" style={isDark ? irBlack : vs}>
          {children ?? ''}
        </SyntaxHighlighter>
      ) : (
        <pre className="sb-json-output">{children ?? ''}</pre>
      )}
    </div>
  );
};
