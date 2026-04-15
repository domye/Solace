/**
 * Markdown 渲染组件
 *
 * 将 Markdown 内容渲染为 HTML，支持：
 * - GFM 语法（表格、任务列表等）
 * - 代码高亮
 * - 标题锚点
 * - 目录提取
 * - 图片画廊 (:::gallery 容器语法)
 *
 * 性能优化：
 * - 静态组件定义移到外部，避免重复创建
 * - 所有子组件使用 memo 包装
 * - useMemo 缓存标题提取结果
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import React, { memo, useEffect, useMemo, type ReactNode } from 'react';
import type { TocHeading } from '@/components/widget/TableOfContents';
import { CodeBlock, LazyImage } from '@/components/common/ui';
import { ImageGallery } from '@/components/post/ImageGallery';
import { remarkGallery } from '@/lib/remark/gallery';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onHeadingsExtracted?: (headings: TocHeading[]) => void;
}

/** 生成标题 ID */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 标题样式配置 */
const HEADING_STYLES = {
  h1: { size: 'text-3xl', margin: 'mt-8 mb-4' },
  h2: { size: 'text-2xl', margin: 'mt-6 mb-3' },
  h3: { size: 'text-xl', margin: 'mt-4 mb-2' },
  h4: { size: 'text-lg', margin: 'mt-3 mb-2' },
} as const;

/** 从 markdown 内容提取标题 */
export function extractHeadings(content: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = content.split('\n');

  // 跟踪代码块状态，避免将代码块内的注释识别为标题
  let inCodeBlock = false;
  let inFencedCode = false;

  for (const line of lines) {
    // 检测围栏代码块的开始/结束 (``` 或 ~~~)
    const fencedMatch = line.match(/^(`{3,}|~{3,})/);
    if (fencedMatch) {
      if (!inCodeBlock) {
        // 进入代码块
        inCodeBlock = true;
        inFencedCode = true;
      } else if (inFencedCode) {
        // 离开代码块
        inCodeBlock = false;
        inFencedCode = false;
      }
      continue;
    }

    // 跳过代码块内的内容
    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match?.[1] && match[2]) {
      const depth = match[1].length;
      const text = match[2].trim();
      const id = generateHeadingId(text);
      headings.push({ id, text, depth });
    }
  }

  return headings;
}

/** 创建标题组件 */
function createHeadingComponent(level: 'h1' | 'h2' | 'h3' | 'h4') {
  const { size, margin } = HEADING_STYLES[level];

  return function Heading({ children }: { children?: ReactNode }) {
    const text = String(children || '');
    const id = generateHeadingId(text);

    return React.createElement(
      level,
      { id, className: `${size} font-bold ${margin} text-90 scroll-mt-24 transition-colors` },
      React.createElement(
        'a',
        {
          href: `#${id}`,
          className: '!text-90 hover:!text-[var(--primary)] !border-none !bg-transparent before:content-["#"] before:absolute before:-left-5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:text-[var(--primary)] relative',
        },
        children
      )
    );
  };
}

/** 检查 children 是否只包含图片元素 */
function containsOnlyImages(children: ReactNode): boolean {
  const childArray = React.Children.toArray(children);
  // 过滤掉空白文本节点（换行符等）
  const nonEmptyChildren = childArray.filter((child) => {
    if (typeof child === 'string') return child.trim().length > 0;
    return true;
  });
  // 如果没有非空子元素，返回 false
  if (nonEmptyChildren.length === 0) return false;
  // 检查所有非空子元素是否都是图片
  return nonEmptyChildren.every((child) => {
    if (React.isValidElement(child)) {
      // 检查是否是图片元素：img 标签或 Image 组件
      return child.type === 'img' || child.type === Image;
    }
    return false;
  });
}

/** 段落组件 - 如果只包含图片则渲染为 div，避免 HTML 嵌套错误 */
const Paragraph = memo(function Paragraph({ children }: { children?: ReactNode }) {
  // 如果段落只包含图片，使用 div 包裹，避免 <div> 嵌套在 <p> 内的 HTML 错误
  if (containsOnlyImages(children)) {
    return <div className="mb-4">{children}</div>;
  }
  return <p className="mb-4 leading-relaxed text-75">{children}</p>;
});

/** 链接组件 */
const Anchor = memo(function Anchor({ href, children }: { href?: string; children?: ReactNode }) {
  const isExternal = href?.startsWith('http');
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="text-[var(--primary)] underline decoration-[var(--link-underline)] decoration-dashed underline-offset-4 hover:decoration-transparent hover:bg-[var(--btn-plain-bg-hover)] transition-smooth"
    >
      {children}
    </a>
  );
});

/** Pre 容器组件 (代码块的外层包装，直接返回 children) */
const PreContainer = memo(function PreContainer({ children }: { children?: ReactNode }) {
  return <>{children}</>;
});

/** 代码组件 */
const Code = memo(function Code({ className, children, inline }: { className?: string; children?: ReactNode; inline?: boolean }) {
  // 行内代码
  if (inline || (!className?.includes('hljs') && !className?.includes('language-'))) {
    return (
      <code className="bg-[var(--inline-code-bg)] text-[var(--inline-code-color)] px-1.5 py-0.5 rounded-[var(--radius-small)] font-mono text-sm">
        {children}
      </code>
    );
  }

  // 代码块
  const langMatch = className?.match(/language-(\w+)/);
  const lang = langMatch?.[1] || '';

  const codeText = typeof children === 'string'
    ? children
    : React.Children.toArray(children)
        .map((c) => {
          if (typeof c === 'string') return c;
          if (React.isValidElement(c) && c.props.children) {
            return c.props.children;
          }
          return '';
        })
        .join('');

  return (
    <CodeBlock className={className || ''} language={lang}>
      {codeText}
    </CodeBlock>
  );
});

/** 无序列表 */
const UnorderedList = memo(function UnorderedList({ children }: { children?: ReactNode }) {
  return <ul className="list-disc list-inside mb-4 space-y-2 text-75">{children}</ul>;
});

/** 有序列表 */
const OrderedList = memo(function OrderedList({ children }: { children?: ReactNode }) {
  return <ol className="list-decimal list-inside mb-4 space-y-2 text-75">{children}</ol>;
});

/** 列表项 */
const ListItem = memo(function ListItem({ children }: { children?: ReactNode }) {
  return <li className="marker:text-[var(--primary)]">{children}</li>;
});

/** 引用块 */
const Blockquote = memo(function Blockquote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="not-italic border-l-4 border-[var(--primary)] pl-4 py-2 my-4 bg-[var(--btn-regular-bg)] text-75">
      {children}
    </blockquote>
  );
});

/** 分隔线 */
const HorizontalRule = memo(function HorizontalRule() {
  return <hr className="my-6 border-t border-[var(--border-medium)]" />;
});

/** 图片组件 */
const Image = memo(function Image({ src, alt }: { src?: string; alt?: string }) {
  return (
    <LazyImage
      src={src || ''}
      alt={alt}
      className="max-w-full h-auto rounded-[var(--radius-large)] my-4 mx-auto"
      effect="blur"
    />
  );
});

/** 表格容器 */
const Table = memo(function Table({ children }: { children?: ReactNode }) {
  return (
    <div className="overflow-x-auto my-4 rounded-[var(--radius-large)] border border-[var(--border-light)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
});

/** 表头行 */
const TableHead = memo(function TableHead({ children }: { children?: ReactNode }) {
  return <thead className="bg-[var(--btn-regular-bg)]">{children}</thead>;
});

/** 表格主体 */
const TableBody = memo(function TableBody({ children }: { children?: ReactNode }) {
  return <tbody>{children}</tbody>;
});

/** 表格行 */
const TableRow = memo(function TableRow({ children }: { children?: ReactNode }) {
  return <tr className="border-t border-[var(--border-light)]">{children}</tr>;
});

/** 表头单元格 */
const TableHeaderCell = memo(function TableHeaderCell({ children }: { children?: ReactNode }) {
  return <th className="px-4 py-2 text-left font-bold text-90">{children}</th>;
});

/** 表格单元格 */
const TableCell = memo(function TableCell({ children }: { children?: ReactNode }) {
  return <td className="px-4 py-2 text-75">{children}</td>;
});

/** Gallery 组件 - 渲染 gallery 节点 */
const Gallery = memo(function Gallery({
  'data-photos': photosJson,
  'data-row-height': rowHeightStr,
  'data-columns': columnsStr,
}: {
  'data-photos'?: string;
  'data-row-height'?: string;
  'data-columns'?: string;
}) {
  if (!photosJson) return null;

  try {
    const photos = JSON.parse(photosJson);
    const rowHeight = rowHeightStr ? parseInt(rowHeightStr, 10) : undefined;
    const columns = columnsStr ? parseInt(columnsStr, 10) : undefined;

    return (
      <ImageGallery
        photos={photos}
        targetRowHeight={rowHeight}
        columns={columns}
      />
    );
  } catch {
    return null;
  }
});

/** Markdown 组件映射 */
const MARKDOWN_COMPONENTS = {
  h1: createHeadingComponent('h1'),
  h2: createHeadingComponent('h2'),
  h3: createHeadingComponent('h3'),
  h4: createHeadingComponent('h4'),
  p: Paragraph,
  a: Anchor,
  pre: PreContainer,
  code: Code,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  hr: HorizontalRule,
  img: Image,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeaderCell,
  td: TableCell,
  gallery: Gallery,
} as const;

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = '',
  onHeadingsExtracted,
}: MarkdownRendererProps) {
  // 提取标题并通知父组件 (使用 useMemo 缓存结果)
  const headings = useMemo(() => extractHeadings(content), [content]);

  useEffect(() => {
    onHeadingsExtracted?.(headings);
  }, [headings, onHeadingsExtracted]);

  return (
    <div className={`custom-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkGallery]}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
