/** 日期格式化工具 */

export function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	return new Date(dateStr).toISOString().split("T")[0] ?? "";
}

export function formatDateTime(dateStr?: string): string {
	return dateStr ? new Date(dateStr).toLocaleString() : "";
}

export function formatShortDate(dateStr?: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export function formatTags(tags?: { id: number; name: string }[]): string {
	return tags?.length ? tags.map((t) => `#${t.name}`).join(" ") : "";
}

/** 获取文章显示日期（优先发布日期） */
export function getArticleDate(article: { published_at?: string; created_at: string }): string {
	return article.published_at ? formatDate(article.published_at) : formatDate(article.created_at);
}
