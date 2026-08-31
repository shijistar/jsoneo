import { Alert } from 'antd';

interface TrustedInputNoticeProps {
  variant?: 'warning' | 'info';
  children?: React.ReactNode;
}

export const TrustedInputNotice = ({ variant = 'warning', children }: TrustedInputNoticeProps) => {
  const defaultContent = (
    <>
      <strong>jsoneo.parse() executes generated JavaScript code.</strong> Only parse data produced by jsoneo.stringify()
      from trusted sources. Never parse untrusted user input or arbitrary strings. This playground uses a curated
      fixture whitelist.
    </>
  );

  return (
    <Alert
      type={variant}
      showIcon
      role="alert"
      style={{ marginBottom: '1rem' }}
      message={variant === 'warning' ? '⚠️ Security Notice' : 'ℹ️ Information'}
      description={children || defaultContent}
    />
  );
};
