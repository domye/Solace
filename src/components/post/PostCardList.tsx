/**
 * 文章卡片列表组件
 *
 * 布局规则（移动端和PC端统一）：
 * - 有封面的卡片：占满整行
 * - 无封面的卡片：相邻配对，两列布局
 * - 无封面卡片如果下一个也有封面或是最后一个，则单独占满整行
 */

import { PostCard } from "./PostCard";
import type { PostCardArticle } from "@/types";

interface PostCardListProps {
	articles: PostCardArticle[];
	className?: string;
}

export function PostCardList({ articles, className = "" }: PostCardListProps) {
	// 预计算每个无封面卡片是否应该占半行
	// 规则：相邻的两个无封面卡片配对，各占半行
	const halfRowIndices = new Set<number>();

	for (let i = 0; i < articles.length; i++) {
		const current = articles[i];
		// TypeScript 在循环中不能自动推断边界，但循环条件保证 current 存在
		if (!current) continue;

		// 跳过有封面的
		if (current.cover_image) continue;

		// 检查下一个是否也无封面
		const next = articles[i + 1];
		if (next && !next.cover_image) {
			// 相邻配对成功，两个都占半行
			halfRowIndices.add(i);
			halfRowIndices.add(i + 1);
			// 跳过下一个，因为它已经配对了
			i++;
		}
		// 如果没有配对成功，不加入halfRowIndices，会占整行
	}

	return (
		<div className={`grid grid-cols-2 gap-3 md:gap-4 ${className}`}>
			{articles.map((article, index) => {
				const hasCover = Boolean(article.cover_image);

				// 有封面占整行，无封面根据配对情况决定
				const shouldSpanHalfRow = !hasCover && halfRowIndices.has(index);
				const colSpanClass = shouldSpanHalfRow
					? "" // 配对成功，占半行（grid-cols-2 默认行为）
					: "col-span-2"; // 占整行

				return (
					<PostCard
						key={article.id}
						article={article}
						isHalfRow={shouldSpanHalfRow}
						className={`content-appear ${colSpanClass}`}
						style={{ animationDelay: `${index * 40}ms` }}
					/>
				);
			})}
		</div>
	);
}
