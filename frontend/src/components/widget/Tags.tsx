import { memo } from "react";
import { Link } from "react-router-dom";
import { useTags } from "@/hooks";
import { sidebarTitleStyle } from "@/utils";

interface TagsProps {
	className?: string;
	style?: React.CSSProperties;
}

export const Tags = memo(function Tags({ className, style }: TagsProps) {
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
			<nav className="px-2.5 lg:px-3 flex gap-1 lg:gap-1.5 flex-wrap" aria-label="标签导航">
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
			</nav>
		</div>
	);
});
