/**
 * 元信息项组件
 *
 * 用于文章卡片、详情页等场景展示图标+文本
 */

import { Icon } from '@iconify/react';

interface MetaItemProps {
  icon: string;
  text: string;
  /** 样式变体：default 为普通样式，warning 为警告样式 */
  variant?: 'default' | 'warning';
  className?: string;
}

export function MetaItem({
  icon,
  text,
  variant = 'default',
  className = ''
}: MetaItemProps) {
  const iconClass = variant === 'warning'
    ? 'meta-icon bg-amber-500/20 text-amber-600'
    : 'meta-icon transition-smooth';

  return (
    <div className={`flex items-center transition-smooth hover:text-[var(--primary)] ${className}`}>
      <div className={iconClass}>
        <Icon icon={icon} className="text-xl" />
      </div>
      <span className="text-50 text-sm font-medium">{text}</span>
    </div>
  );
}
