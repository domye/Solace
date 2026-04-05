import { Link } from 'react-router-dom';
import { useTags } from '@/hooks/useApi';

interface TagsProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Tags({ className, style }: TagsProps) {
  const { data: tags, isLoading, error } = useTags();

  if (isLoading) {
    return (
      <div className={`card-base pb-4 onload-animation ${className || ''}`} style={style}>
        <div className="font-bold text-lg text-90 relative ml-8 mt-4 mb-2
          before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
          before:absolute before:-left-4 before:top-[5.5px]">
          Tags
        </div>
        <div className="px-4 py-4 text-50 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`card-base pb-4 onload-animation ${className || ''}`} style={style}>
      <div className="font-bold text-lg text-90 relative ml-8 mt-4 mb-2
        before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
        before:absolute before:-left-4 before:top-[5.5px]">
        Tags
      </div>
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