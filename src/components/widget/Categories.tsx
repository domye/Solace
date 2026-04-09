import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks';

interface CategoriesProps {
  className?: string;
  style?: React.CSSProperties;
}

/** 侧边栏标题样式 */
const sidebarTitleStyle = 'font-bold text-lg text-90 relative ml-8 mt-4 mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-4 before:top-[5.5px]';

export function Categories({ className, style }: CategoriesProps) {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className={`card-base pb-4 ${className || ''}`} style={style}>
        <div className={sidebarTitleStyle}>分类</div>
        <div className="px-4 py-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !categories?.length) return null;

  return (
    <div className={`card-base pb-4 onload-animation ${className || ''}`} style={style}>
      <div className={sidebarTitleStyle}>分类</div>
      <div className="px-4 space-y-1">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${cat.slug}`}
            className="w-full h-10 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]
              transition-all pl-2 hover:pl-3 text-75 hover:text-[var(--primary)] flex items-center justify-between group"
          >
            <span className="truncate">{cat.name}</span>
            {cat.article_count !== undefined && (
              <span className="flex items-center justify-center px-2 h-7 ml-4 min-w-[2rem] rounded-lg text-sm font-bold
                text-[var(--btn-content)] bg-[var(--btn-regular-bg)]
                group-hover:bg-[var(--primary)] group-hover:text-white transition">
                {cat.article_count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}