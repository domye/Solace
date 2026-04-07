import { Icon } from '@iconify/react';

interface MetaItemProps {
  icon: string;
  text: string;
  className?: string;
}

/**
 * 元信息项组件 - 用于文章卡片、详情页等
 */
export function MetaItem({ icon, text, className = '' }: MetaItemProps) {
  return (
    <div className={`flex items-center transition-smooth hover:text-[var(--primary)] ${className}`}>
      <div className="meta-icon transition-smooth">
        <Icon icon={icon} className="text-xl" />
      </div>
      <span className="text-50 text-sm font-medium">{text}</span>
    </div>
  );
}