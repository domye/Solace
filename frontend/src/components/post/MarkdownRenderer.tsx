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
 * - CodeBlock 懒加载，减少首屏 bundle 体积
 * - ImageGallery 懒加载，仅在需要时加载图片画廊组件
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkBreaks from "remark-breaks";
import React, {
	memo,
	useEffect,
	useMemo,
	lazy,
	Suspense,
	type ReactNode,
} from "react";
import type { CSSProperties } from "react";
import { useState, useCallback, createContext, useContext } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { TocHeading } from "@/components/widget/TableOfContents";
import { LazyImage } from "@/components/common/ui";

/** 图片点击预览 Context */
const ImagePreviewContext = createContext<(src: string, alt: string) => void>(() => {});
import { useImageSettings } from "@/hooks";
import { remarkGallery } from "@/lib/remark/gallery";
import { getImageRenderMetadata } from "@/utils/image";

// 懒加载 CodeBlock - 代码高亮仅在需要时加载 (~70 KB)
const DEFAULT_IMAGE_MAX_WIDTH = 1000;

const CodeBlock = lazy(() =>
	import("@/components/common/ui/CodeBlock").then((m) => ({
		default: m.CodeBlock,
	})),
);

// 懒加载 ImageGallery - 图片画廊仅在需要时加载 (~64 KB)
const ImageGallery = lazy(() =>
	import("@/components/post/ImageGallery").then((m) => ({
		default: m.ImageGallery,
	})),
);

// 代码块加载占位符
function CodeBlockFallback({ codeText }: { codeText: string }) {
	return (
		<pre className="bg-[var(--codeblock-bg)] p-4 rounded-xl overflow-x-auto text-sm font-mono">
			<code>{codeText}</code>
		</pre>
	);
}

interface MarkdownRendererProps {
	content: string;
	className?: string;
	onHeadingsExtracted?: (headings: TocHeading[]) => void;
}

/** 生成标题 ID */
function generateHeadingId(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

/** 标题样式配置 */
const HEADING_STYLES = {
	h1: { size: "text-xl md:text-2xl lg:text-3xl", margin: "mt-6 md:mt-8 mb-3 md:mb-4" },
	h2: { size: "text-lg md:text-xl lg:text-2xl", margin: "mt-5 md:mt-6 mb-2 md:mb-3" },
	h3: { size: "text-base md:text-lg lg:text-xl", margin: "mt-4 md:mt-4 mb-2" },
	h4: { size: "text-sm md:text-base lg:text-lg", margin: "mt-3 mb-2" },
} as const;

/** 从 markdown 内容提取标题 */
export function extractHeadings(content: string): TocHeading[] {
	const headings: TocHeading[] = [];
	const lines = content.split("\n");

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
function createHeadingComponent(level: "h1" | "h2" | "h3" | "h4") {
	const { size, margin } = HEADING_STYLES[level];

	return function Heading({ children }: { children?: ReactNode }) {
		const text = String(children || "");
		const id = generateHeadingId(text);

		return React.createElement(
			level,
			{
				id,
				className: `${size} font-bold ${margin} text-90 scroll-mt-24 transition-colors`,
			},
			React.createElement(
				"a",
				{
					href: `#${id}`,
					className:
						'!text-90 hover:!text-[var(--primary)] !border-none !bg-transparent before:content-["#"] before:absolute before:-left-5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:text-[var(--primary)] relative',
				},
				children,
			),
		);
	};
}

/** 检查 children 是否包含图片元素（img 标签或 Image 组件） */
function hasImageChild(children: ReactNode): boolean {
	const childArray = React.Children.toArray(children);
	return childArray.some((child) => {
		if (React.isValidElement(child)) {
			return child.type === "img" || child.type === Image;
		}
		return false;
	});
}

/** 段落组件 - 如果包含图片则渲染为 div，避免 HTML 嵌套错误 */
const Paragraph = memo(function Paragraph({
	children,
}: {
	children?: ReactNode;
}) {
	// 如果段落包含图片，使用 div 包裹，避免 <div> 嵌套在 <p> 内的 HTML 错误
	// 因为 LazyImage 组件会渲染 div wrapper
	if (hasImageChild(children)) {
		return <div className="mb-4">{children}</div>;
	}
	return <p className="mb-4 leading-relaxed text-75">{children}</p>;
});

/** 链接组件 */
const Anchor = memo(function Anchor({
	href,
	children,
}: {
	href?: string;
	children?: ReactNode;
}) {
	const isExternal = href?.startsWith("http");
	return (
		<a
			href={href}
			target={isExternal ? "_blank" : undefined}
			rel={isExternal ? "noopener noreferrer" : undefined}
			className="text-[var(--primary)] underline decoration-[var(--link-underline)] decoration-dashed underline-offset-4 hover:decoration-transparent hover:bg-[var(--btn-plain-bg-hover)] transition-smooth"
		>
			{children}
		</a>
	);
});

/** Pre 容器组件 (代码块的外层包装，直接返回 children) */
const PreContainer = memo(function PreContainer({
	children,
}: {
	children?: ReactNode;
}) {
	return <>{children}</>;
});

/** 代码组件 */
const Code = memo(function Code({
	className,
	children,
	inline,
}: {
	className?: string;
	children?: ReactNode;
	inline?: boolean;
}) {
	// 行内代码
	if (
		inline ||
		(!className?.includes("hljs") && !className?.includes("language-"))
	) {
		return (
			<code className="bg-[var(--inline-code-bg)] text-[var(--inline-code-color)] px-1.5 py-0.5 rounded-[var(--radius-small)] font-mono text-sm">
				{children}
			</code>
		);
	}

	// 代码块 - 使用懒加载
	const langMatch = className?.match(/language-(\w+)/);
	const lang = langMatch?.[1] || "";

	const codeText =
		typeof children === "string"
			? children
			: React.Children.toArray(children)
					.map((c) => {
						if (typeof c === "string") return c;
						if (React.isValidElement(c) && c.props.children) {
							return c.props.children;
						}
						return "";
					})
					.join("");

	return (
		<Suspense fallback={<CodeBlockFallback codeText={codeText} />}>
			<CodeBlock className={className || ""} language={lang}>
				{codeText}
			</CodeBlock>
		</Suspense>
	);
});

/** 无序列表 */
const UnorderedList = memo(function UnorderedList({
	children,
}: {
	children?: ReactNode;
}) {
	return (
		<ul className="list-disc list-inside mb-4 space-y-2 text-75">{children}</ul>
	);
});

/** 有序列表 */
const OrderedList = memo(function OrderedList({
	children,
}: {
	children?: ReactNode;
}) {
	return (
		<ol className="list-decimal list-inside mb-4 space-y-2 text-75">
			{children}
		</ol>
	);
});

/** 列表项 */
const ListItem = memo(function ListItem({
	children,
}: {
	children?: ReactNode;
}) {
	return <li className="marker:text-[var(--primary)]">{children}</li>;
});

/** 引用块 */
const Blockquote = memo(function Blockquote({
	children,
}: {
	children?: ReactNode;
}) {
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
const Image = memo(function Image({
	src,
	alt,
}: {
	src?: string;
	alt?: string;
}) {
	const { data: settings } = useImageSettings();
	const metadata = getImageRenderMetadata(
		src,
		settings?.maxWidth ?? DEFAULT_IMAGE_MAX_WIDTH,
	);
	const style = metadata.width
		? ({ width: metadata.width, maxWidth: "100%", height: "auto" } satisfies CSSProperties)
		: undefined;

	const openPreview = useContext(ImagePreviewContext);

	return (
		<LazyImage
			src={metadata.src}
			alt={alt}
			style={style}
			className="max-w-full h-auto rounded-[var(--radius-large)] my-4 mx-auto cursor-zoom-in"
			effect="blur"
			onClick={() => openPreview(metadata.src, alt ?? "")}
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
const TableHead = memo(function TableHead({
	children,
}: {
	children?: ReactNode;
}) {
	return <thead className="bg-[var(--btn-regular-bg)]">{children}</thead>;
});

/** 表格主体 */
const TableBody = memo(function TableBody({
	children,
}: {
	children?: ReactNode;
}) {
	return <tbody>{children}</tbody>;
});

/** 表格行 */
const TableRow = memo(function TableRow({
	children,
}: {
	children?: ReactNode;
}) {
	return <tr className="border-t border-[var(--border-light)]">{children}</tr>;
});

/** 表头单元格 */
const TableHeaderCell = memo(function TableHeaderCell({
	children,
}: {
	children?: ReactNode;
}) {
	return <th className="px-4 py-2 text-left font-bold text-90">{children}</th>;
});

/** 表格单元格 */
const TableCell = memo(function TableCell({
	children,
}: {
	children?: ReactNode;
}) {
	return <td className="px-4 py-2 text-75">{children}</td>;
});

/** 图片画廊加载占位符 */
function GalleryFallback() {
	return (
		<div className="my-4 flex items-center justify-center py-8 text-50 animate-pulse">
			加载图片画廊...
		</div>
	);
}

/** Gallery 组件 - 渲染 gallery 节点 */
const Gallery = memo(function Gallery({
	"data-photos": photosJson,
	"data-row-height": rowHeightStr,
	"data-columns": columnsStr,
}: {
	"data-photos"?: string;
	"data-row-height"?: string;
	"data-columns"?: string;
}) {
	if (!photosJson) return null;

	try {
		const photos = JSON.parse(photosJson);
		const rowHeight = rowHeightStr ? parseInt(rowHeightStr, 10) : undefined;
		const columns = columnsStr ? parseInt(columnsStr, 10) : undefined;

		return (
			<Suspense fallback={<GalleryFallback />}>
				<ImageGallery
					photos={photos}
					targetRowHeight={rowHeight}
					columns={columns}
				/>
			</Suspense>
		);
	} catch {
		return null;
	}
});

/** Markdown 组件映射 */
const MARKDOWN_COMPONENTS = {
	h1: createHeadingComponent("h1"),
	h2: createHeadingComponent("h2"),
	h3: createHeadingComponent("h3"),
	h4: createHeadingComponent("h4"),
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
	className = "",
	onHeadingsExtracted,
}: MarkdownRendererProps) {
	const headings = useMemo(() => extractHeadings(content), [content]);

	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewSrc, setPreviewSrc] = useState("");
	const [previewAlt, setPreviewAlt] = useState("");
	const openPreview = useCallback((src: string, alt: string) => {
		setPreviewSrc(src);
		setPreviewAlt(alt);
		setPreviewOpen(true);
	}, []);
	useEffect(() => {
		onHeadingsExtracted?.(headings);
	}, [headings, onHeadingsExtracted]);

	return (
		<div className={`custom-md ${className}`}>
			<ImagePreviewContext.Provider value={openPreview}>
				<ReactMarkdown
					remarkPlugins={[remarkGfm, remarkDirective, remarkGallery, remarkBreaks]}
					components={MARKDOWN_COMPONENTS}
				>
					{content}
				</ReactMarkdown>
			</ImagePreviewContext.Provider>
			<Lightbox
				open={previewOpen}
				close={() => setPreviewOpen(false)}
				slides={[{ src: previewSrc, alt: previewAlt }]}
				carousel={{ finite: true }}
				controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
				styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.85)" } }}
				render={{ slide: (props) => (
					<img
						src={props.slide.src}
						alt={props.slide.alt ?? ""}
						style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" as const }}
					/>
				) }}
			/>
		</div>
	);
});
