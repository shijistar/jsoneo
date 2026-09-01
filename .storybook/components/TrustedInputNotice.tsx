import { Alert } from 'antd';
import { useStoryT } from '../locales';

interface TrustedInputNoticeProps {
  variant?: 'warning' | 'info';
  children?: React.ReactNode;
}

export const TrustedInputNotice = ({ variant = 'warning', children }: TrustedInputNoticeProps) => {
  const t = useStoryT();
  const defaultContent = <>{t('story.security.defaultNotice')}</>;

  return (
    <Alert
      type={variant}
      showIcon
      role="alert"
      style={{ marginBottom: '1rem' }}
      title={variant === 'warning' ? t('story.security.warningTitle') : t('story.security.infoTitle')}
      description={children || defaultContent}
    />
  );
};
