import { Link } from 'react-router-dom';
import type { Tag } from '@/types';

interface TagListProps {
  tags?: Tag[];
  /** 最多显示的标签数量 */
  maxTags?: number;
  /** 是否可交互（渲染为链接），设为 false 时渲染为纯文本 */
  interactive?: boolean;
}

export function TagList({ tags, maxTags, interactive = true }: TagListProps) {
  const displayTags = maxTags ? tags?.slice(0, maxTags) : tags;

  if (!displayTags || displayTags.length === 0) {
    return <span className="text-xs text-30">暂无标签</span>;
  }

  // 当 interactive=false 时，渲染为纯文本 span，避免嵌套 <a> 标签
  if (!interactive) {
    return (
      <>
        {displayTags.map((tag) => (
          <span
            key={tag.id}
            className="btn-regular h-6 text-xs px-2 rounded-lg whitespace-nowrap"
          >
            # {tag.name}
          </span>
        ))}
      </>
    );
  }

  return (
    <>
      {displayTags.map((tag) => (
        <Link
          key={tag.id}
          to={`/tags/${tag.slug}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-regular h-6 text-xs px-2 rounded-lg hover:text-[var(--primary)] whitespace-nowrap"
        >
          # {tag.name}
        </Link>
      ))}
    </>
  );
}
