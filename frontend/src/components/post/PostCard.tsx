/**
 * 文章卡片组件
 *
 * 响应式布局：
 * - 移动端：左侧内容 + 右侧小封面
 * - 桌面端：左侧内容 + 右侧封面/箭头按钮
 */
import { Link } from "react-router-dom";
import { LazyImage, SafeIcon } from "@/components/common/ui";
import { PostMeta } from "./PostMeta";
import { TagList } from "./TagList";
import type { PostCardArticle } from "@/types";

// ============ 常量 ============

const COVER_WIDTH = "25%";
const ARROW_WIDTH = "52px";

// ============ 类型定义 ============

interface PostCardProps {
	article: PostCardArticle;
	/** 两列模式（无封面卡片配对时） */
	isHalfRow?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

// ============ 子组件 ============

/** 箭头图标 */
function ArrowIcon({
	size = "1.75rem",
	className,
}: {
	size?: string;
	className?: string;
}) {
	return (
		<SafeIcon
			icon="material-symbols:chevron-right-rounded"
			size={size}
			className={`text-[var(--primary)]${className ? ` ${className}` : ""}`}
		/>
	);
}

/** 封面图片 */
function CoverImage({
	src,
	alt,
	className,
	wrapperClassName,
}: {
	src: string;
	alt?: string;
	className?: string;
	wrapperClassName?: string;
}) {
	return (
		<LazyImage
			src={src}
			alt={alt || ""}
			className={className}
			wrapperClassName={wrapperClassName}
			aspectRatio="4/3"
			effect="blur"
		/>
	);
}

/** 桌面端封面链接 */
function DesktopCover({
	url,
	cover_image,
	title,
}: {
	url: string;
	cover_image: string;
	title: string;
}) {
	return (
		<Link
			to={url}
			className="group w-[var(--coverWidth)] absolute top-2.5 bottom-2.5 right-2.5 rounded-[var(--radius-small)] overflow-hidden"
			aria-label={`查看文章: ${title}`}
		>
			<div className="absolute inset-0 group-hover:bg-black/30" />
			<ArrowIcon
				size="2.5rem"
				className="absolute z-20 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 text-white inset-0 m-auto transition-transform"
			/>
			<CoverImage
				src={cover_image}
				className="w-full h-full object-cover group-hover:scale-105 transition-transform"
				wrapperClassName="w-full h-full"
			/>
		</Link>
	);
}

/** 桌面端箭头按钮 */
function DesktopArrow({ url }: { url: string }) {
	return (
		<Link
			to={url}
			className="btn-regular w-12 absolute right-2.5 top-2.5 bottom-2.5 hover:bg-[var(--btn-regular-bg-hover)] transition-colors"
			aria-label="阅读全文"
		>
			<ArrowIcon size="2rem" className="mx-auto" />
		</Link>
	);
}

/** 移动端封面 */
function MobileCover({
	cover_image,
}: {
	cover_image: string;
}) {
	return (
		<div className="flex-shrink-0 self-end rounded-[var(--radius-small)] overflow-hidden w-[90px]">
			<CoverImage src={cover_image} className="w-full h-full object-cover" wrapperClassName="w-full" />
		</div>
	);
}

/** 标签列表 */
function CardTags({
	tags,
	maxTags,
}: {
	tags: PostCardArticle["tags"];
	maxTags?: number;
}) {
	return (
		<div className="flex flex-wrap gap-1 mt-1.5">
			<TagList
				tags={tags}
				maxTags={maxTags}
				interactive={maxTags === undefined}
			/>
		</div>
	);
}

// ============ 主组件 ============

export function PostCard({
	article,
	isHalfRow = false,
	className,
	style,
}: PostCardProps) {
	const hasCover = Boolean(article.cover_image);
	const url = `/articles/${article.slug}`;
	const summary = article.summary || "暂无摘要";

	// 计算内容区域宽度
	const contentWidth = hasCover
		? `calc(100% - ${COVER_WIDTH} - 12px)`
		: isHalfRow
			? "100%"
			: `calc(100% - ${ARROW_WIDTH} - 12px)`;

	return (
		<article
			className={`card-base w-full overflow-hidden relative${className ? ` ${className}` : ""}`}
			style={{ ...style, "--coverWidth": COVER_WIDTH } as React.CSSProperties}
		>
			{/* 移动端布局 */}
			<Link
				to={url}
				className="md:hidden flex gap-2.5 p-3 active:scale-[0.98] transition-transform"
			>
				<div className="flex-1 min-w-0 flex flex-col">
					<h2 className="font-semibold text-sm leading-snug line-clamp-1 mb-0.5">
						{article.title}
					</h2>
					<p className="text-xs text-[var(--text-50)] line-clamp-2 leading-relaxed flex-1">
						{summary}
					</p>
					<CardTags tags={article.tags} maxTags={2} />
				</div>
				{hasCover && (
					<MobileCover
						cover_image={article.cover_image!}
					/>
				)}
			</Link>

			{/* 桌面端布局 */}
			<div className="hidden md:flex md:flex-col w-full relative">
				<div className="pl-8 pr-4 pt-5 pb-4 relative" style={{ width: contentWidth }}>
					{/* 标题带装饰条 */}
					<Link
						to={url}
						className="group w-full block font-semibold mb-2.5 text-[1.375rem] hover:text-[var(--primary)]
							before:w-1.5 before:h-5 before:rounded-md before:bg-[var(--primary)]
							before:absolute before:top-[25px] before:left-[16px]"
					>
						{article.title}
						<ArrowIcon
							size="1.75rem"
							className="inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
						/>
					</Link>

					<PostMeta article={article} />
					<p className="text-[var(--text-75)] mb-2.5 line-clamp-1 text-sm">
						{summary}
					</p>
					<CardTags tags={article.tags} />
				</div>

				{/* 右侧封面或箭头 */}
				{hasCover ? (
					<DesktopCover
						url={url}
						cover_image={article.cover_image!}
						title={article.title}
					/>
				) : (
					!isHalfRow && <DesktopArrow url={url} />
				)}
			</div>
		</article>
	);
}
