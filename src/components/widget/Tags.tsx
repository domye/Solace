import { Link } from 'react-router-dom';
import { useTags } from '@/hooks';

interface TagsProps {
  className?: string;
  style?: React.CSSProperties;
}

/** 侧边栏标题样式 */
const sidebarTitleStyle = 'font-bold text-lg text-90 relative ml-8 mt-4 mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-4 before:top-[5.5px]';

export function Tags({ className, style }: TagsProps) {
  const { data: tags, isLoading, error } = useTags();

  if (isLoading) {
    return (
      <div className={`card-base pb-4 ${className || ''}`} style={style}>
        <div className={sidebarTitleStyle}>标签</div>
        <div className="px-4 flex gap-2 flex-wrap">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tags?.length) return null;

  return (
    <div className={`card-base pb-4 onload-animation ${className || ''}`} style={style}>
      <div className={sidebarTitleStyle}>标签</div>
      <div className="px-4 flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to={`/tags/${tag.slug}`}
            className="btn-regular h-8 text-sm px-3 rounded-lg hover:bg-[var(--primary)] hover:text-white transition"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}