/**
 * TanStack Query Key Factory
 * 集中管理所有查询键，确保类型安全和一致性
 */

export const queryKeys = {
	articles: {
		list: (params?: {
			page?: number;
			pageSize?: number;
			status?: string;
			category?: string;
			tag?: string;
		}) => ["articles", params] as const,
		detail: (id: number) => ["article", id] as const,
		bySlug: (slug: string) => ["article", slug] as const,
		archive: () => ["articles", "archive"] as const,
		search: (query: string, page?: number, pageSize?: number) =>
			["articles", "search", query, { page, pageSize }] as const,
		random: (limit?: number) => ["articles", "random", limit] as const,
		recent: (limit?: number) => ["articles", "recent", limit] as const,
	},
	categories: {
		all: () => ["categories"] as const,
		detail: (id: number) => ["category", id] as const,
	},
	tags: {
		all: () => ["tags"] as const,
		detail: (id: number) => ["tag", id] as const,
	},
	pages: {
		list: (params?: { page?: number; pageSize?: number; status?: string; template?: string }) =>
			["pages", params] as const,
		detail: (id: number) => ["page", id] as const,
		bySlug: (slug: string) => ["page", slug] as const,
		nav: () => ["pages", "nav"] as const,
	},
	owner: {
		profile: () => ["owner"] as const,
	},
	github: {
		contributions: (username?: string) => ["github", "contributions", username] as const,
	},
	auth: {
		me: () => ["auth", "me"] as const,
	},
} as const;
