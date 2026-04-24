import { Link } from "react-router-dom";
import { useTags } from "@/hooks";

interface TagsProps {
	className?: string;
	style?: React.CSSProperties;
}

/** 侧边栏标题样式 */
const sidebarTitleStyle =
	"font-bold text-sm lg:text-base text-90 relative ml-5 lg:ml-6 mt-2.5 lg:mt-3 mb-1 lg:mb-1.5 before:w-0.5 before:h-3 lg:before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-2.5 lg:before:-left-3 before:top-[3.5px] lg:before:top-[4.5px]";

export function Tags({ className, style }: TagsProps) {
	const { data: tags, isLoading, error } = useTags();

	if (isLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				<div className={sidebarTitleStyle}>标签</div>
				<div className="px-2.5 lg:px-3 flex gap-1 lg:gap-1.5 flex-wrap">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-6 lg:h-7 w-12 lg:w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error || !tags?.length) return null;

	return (
		<div
			className={`card-base pb-3 onload-animation ${className || ""}`}
			style={style}
		>
			<div className={sidebarTitleStyle}>标签</div>
			<div className="px-2.5 lg:px-3 flex gap-1 lg:gap-1.5 flex-wrap">
				{tags.map((tag) => (
					<Link
						key={tag.id}
						to={`/tags/${tag.slug}`}
						onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
						className="btn-regular h-6 lg:h-7 text-[10px] lg:text-xs px-2 lg:px-2.5 rounded-md hover:bg-[var(--primary)] hover:text-white transition"
					>
						{tag.name}
					</Link>
				))}
			</div>
		</div>
	);
}
