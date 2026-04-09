/** 目录状态管理 */

import { create } from "zustand";
import type { TocHeading } from "@/components/widget/TableOfContents";

interface TocState {
	headings: TocHeading[];
	isArticleLoading: boolean;
	setHeadings: (headings: TocHeading[]) => void;
	clearHeadings: () => void;
	setArticleLoading: (loading: boolean) => void;
}

export const useTocStore = create<TocState>((set, get) => ({
	headings: [],
	isArticleLoading: false,
	setHeadings: (h) =>
		JSON.stringify(get().headings) !== JSON.stringify(h) &&
		set({ headings: h, isArticleLoading: false }),
	clearHeadings: () => get().headings.length && set({ headings: [] }),
	setArticleLoading: (loading) => set({ isArticleLoading: loading }),
}));
