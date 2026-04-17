/**
 * 文章元信息组件
 */

import { SafeIcon } from "@/components/common/ui";
import { Link } from "react-router-dom";
import { formatDate } from "@/utils/date";
import { MetaItem } from "@/components/common/ui";
import type { PostCardArticle } from "@/types";

export function PostMeta({ article }: { article: PostCardArticle }) {
	return (
		<div className="flex flex-wrap text-50 items-center gap-4 gap-y-2 mb-4">
			<MetaItem
				icon="material-symbols:calendar-today-outline-rounded"
				text={formatDate(article.published_at || article.created_at)}
			/>
			{article.category && (
				<Link
					to={`/categories/${article.category.slug}`}
					className="flex items-center text-50 hover:text-[var(--primary)] transition-colors"
				>
					<div className="meta-icon">
						<SafeIcon
							icon="material-symbols:book-2-outline-rounded"
							size="1.25rem"
						/>
					</div>
					<span className="text-sm font-medium whitespace-nowrap">
						{article.category.name}
					</span>
				</Link>
			)}
			{article.status === "draft" && (
				<MetaItem
					icon="material-symbols:edit-note-rounded"
					text="草稿"
					variant="warning"
				/>
			)}
		</div>
	);
}
