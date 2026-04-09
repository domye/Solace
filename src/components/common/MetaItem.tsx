/**
 * 元信息项组件
 */

import { Icon } from '@iconify/react';

export function MetaItem({ icon, text, variant = 'default', className = '' }: { icon: string; text: string; variant?: 'default' | 'warning'; className?: string }) {
  const iconClass = variant === 'warning' ? 'meta-icon bg-amber-500/20 text-amber-600' : 'meta-icon transition-smooth';

  return (
    <div className={`flex items-center transition-smooth hover:text-[var(--primary)] ${className}`}>
      <div className={iconClass}>
        <Icon icon={icon} className="text-xl" />
      </div>
      <span className="text-50 text-sm font-medium">{text}</span>
    </div>
  );
}
