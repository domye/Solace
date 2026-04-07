import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
  count?: number;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * 页面头部组件 - 用于管理页面和列表页
 */
export function PageHeader({ title, subtitle, icon, count, action }: PageHeaderProps) {
  return (
    <div className="card-base p-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center">
            <Icon icon={icon} className="text-xl text-white" />
          </div>
          <div>
            <h1 className="text-90 text-xl font-bold">{title}</h1>
            {(subtitle || count !== undefined) && (
              <p className="text-50 text-sm">
                {subtitle || `共 ${count ?? 0} 条`}
              </p>
            )}
          </div>
        </div>
        {action && (
          action.href ? (
            <Link
              to={action.href}
              className="btn-regular rounded-[var(--radius-medium)] py-2 px-4 font-medium scale-animation ripple"
            >
              <Icon icon="material-symbols:add-rounded" className="mr-1" />
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="btn-regular rounded-[var(--radius-medium)] py-2 px-4 font-medium scale-animation ripple"
            >
              <Icon icon="material-symbols:add-rounded" className="mr-1" />
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}