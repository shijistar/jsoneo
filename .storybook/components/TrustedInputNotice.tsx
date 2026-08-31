import { useCallback, useState } from 'react';

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

  const bgColor = variant === 'warning' ? '#fff8c5' : '#e7f3ff';
  const borderColor = variant === 'warning' ? '#d4a700' : '#0969da';
  const darkBgColor = variant === 'warning' ? '#3d2e00' : '#0d1117';
  const darkBorderColor = variant === 'warning' ? '#d4a700' : '#388bfd';

  return (
    <div
      className="sb-trusted-notice"
      role="alert"
      style={
        {
          background: bgColor,
          borderColor,
        } as React.CSSProperties
      }
    >
      <div className="sb-trusted-notice-title">{variant === 'warning' ? '⚠️ Security Notice' : 'ℹ️ Information'}</div>
      <div className="sb-trusted-notice-content">{children || defaultContent}</div>
    </div>
  );
};
