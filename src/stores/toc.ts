/**
 * 目录状态管理
 *
 * 管理文章目录的标题列表和加载状态
 */

import { create } from 'zustand';
import type { TocHeading } from '@/components/widget/TableOfContents';

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
  setHeadings: (newHeadings) => {
    const currentHeadings = get().headings;
    // 简单的深度比较，防止无限循环
    if (JSON.stringify(currentHeadings) !== JSON.stringify(newHeadings)) {
      set({ headings: newHeadings, isArticleLoading: false });
    }
  },
  clearHeadings: () => {
    if (get().headings.length > 0) {
      set({ headings: [] });
    }
  },
  setArticleLoading: (loading) => {
    set({ isArticleLoading: loading });
  },
}));
