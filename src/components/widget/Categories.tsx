import { Link } from "react-router-dom";
import { useCategories } from "@/hooks";

interface CategoriesProps {
	className?: string;
	style?: React.CSSProperties;
}

/** 侧边栏标题样式 */
const sidebarTitleStyle =
	"font-bold text-base text-90 relative ml-6 mt-3 mb-1.5 before:w-0.5 before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-3 before:top-[4.5px]";

export function Categories({ className, style }: CategoriesProps) {
	const { data: categories, isLoading, error } = useCategories();

	if (isLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				<div className={sidebarTitleStyle}>分类</div>
				<div className="px-3 py-3 space-y-1.5">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error || !categories?.length) return null;

	return (
		<div
			className={`card-base pb-3 onload-animation ${className || ""}`}
			style={style}
		>
			<div className={sidebarTitleStyle}>分类</div>
			<div className="px-3 space-y-0.5">
				{categories.map((cat) => (
					<Link
						key={cat.id}
						to={`/categories/${cat.slug}`}
						onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
						className="w-full h-8 rounded-md hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]
              transition-all pl-2 hover:pl-2.5 text-75 hover:text-[var(--primary)] flex items-center justify-between group"
					>
						<span className="truncate text-sm">{cat.name}</span>
						{cat.article_count !== undefined && (
							<span
								className="flex items-center justify-center px-2 h-5 mr-2 min-w-[1.5rem] rounded text-xs font-medium
                text-[var(--btn-content)] bg-[var(--btn-regular-bg)]
                group-hover:bg-[var(--primary)] group-hover:text-white transition"
							>
								{cat.article_count}
							</span>
						)}
					</Link>
				))}
			</div>
		</div>
	);
}
