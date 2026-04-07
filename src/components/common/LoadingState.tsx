import { Icon } from '@iconify/react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * 全页加载状态
 */
export function LoadingState({ message = '加载中...', className = '' }: LoadingStateProps) {
  return (
    <div className={`card-base p-8 text-center ${className}`}>
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-75">{message}</p>
    </div>
  );
}

/**
 * 内联加载指示器（用于刷新时）
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center py-2 mb-2 ${className}`}>
      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * 空状态展示
 */
export function EmptyState({
  icon = 'material-symbols:article-outline-rounded',
  message = '暂无内容',
  className = '',
}: {
  icon?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`card-base p-8 text-center onload-animation ${className}`}>
      <Icon icon={icon} className="text-4xl text-50 mb-4" />
      <p className="text-75">{message}</p>
    </div>
  );
}