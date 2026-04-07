import { Icon } from '@iconify/react';

interface ErrorDisplayProps {
  message?: string;
  icon?: string;
  className?: string;
}

/**
 * 错误展示组件
 */
export function ErrorDisplay({
  message = '加载失败',
  icon = 'material-symbols:error-outline-rounded',
  className = '',
}: ErrorDisplayProps) {
  return (
    <div className={`card-base p-8 text-center fade-in-up ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
        <Icon icon={icon} className="text-3xl text-red-500" />
      </div>
      <p className="text-75">{message}</p>
    </div>
  );
}

/**
 * 404 未找到展示
 */
export function NotFoundDisplay({
  message = '未找到内容',
  icon = 'material-symbols:search-rounded',
  className = '',
}: {
  message?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={`card-base p-8 text-center fade-in-up ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[var(--btn-regular-bg)] mx-auto mb-4 flex items-center justify-center">
        <Icon icon={icon} className="text-3xl text-[var(--primary)]" />
      </div>
      <p className="text-75">{message}</p>
    </div>
  );
}