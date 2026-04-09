/**
 * 主布局组件
 *
 * 三栏布局结构（参考 Mizuki 主题）：
 * ┌─────────────────────────────────────────────────────────┐
 * │                       Navbar                            │
 * ├─────────────┬─────────────────────┬─────────────────────┤
 * │  LeftSide   │     MainContent     │     RightSide       │
 * │  Profile    │      (Outlet)       │    Categories       │
 * │  TOC        │                     │       Tags          │
 * │ (文章详情页) │                     │                     │
 * └─────────────┴─────────────────────┴─────────────────────┤
 * │                       Footer                            │
 * └─────────────────────────────────────────────────────────┘
 *
 * 响应式：
 * - 移动端：单栏（主内容）
 * - 平板：双栏（左侧边栏 + 主内容）
 * - 桌面：三栏（左侧边栏 + 主内容 + 右侧边栏）
 */

import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { TableOfContents } from '@/components/widget';
import { Profile, Categories, Tags, ContributionCalendar } from '@/components/widget';
import { useTocStore } from '@/stores';
import { useMemo } from 'react';

/** 侧边栏骨架屏 */
function SidebarSkeleton() {
  return (
    <div className="card-base pb-4 animate-pulse">
      <div className="h-6 bg-[var(--btn-regular-bg)] rounded mx-4 mt-4 mb-3 w-16" />
      <div className="px-4 space-y-2">
        <div className="h-9 bg-[var(--btn-regular-bg)] rounded-lg" />
        <div className="h-9 bg-[var(--btn-regular-bg)] rounded-lg w-3/4" />
        <div className="h-9 bg-[var(--btn-regular-bg)] rounded-lg w-5/6" />
        <div className="h-9 bg-[var(--btn-regular-bg)] rounded-lg w-2/3" />
      </div>
    </div>
  );
}

/** 左侧边栏组件 */
interface LeftSidebarProps {
  isArticlePage: boolean;
  headings: { id: string; text: string; depth: number }[];
  isLoading: boolean;
}

function LeftSidebar({ isArticlePage, headings, isLoading }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      {/* 顶部组件区域 - Profile 始终显示 */}
      <div className="flex flex-col w-full gap-4 mb-4">
        <Profile />
      </div>

      {/* 吸顶组件区域 */}
      <div className="sticky top-4 flex flex-col w-full gap-4">
        {/* 文章详情页显示 TOC，否则显示 Tags */}
        {isArticlePage ? (
          isLoading && headings.length === 0 ? (
            <SidebarSkeleton />
          ) : headings.length > 0 ? (
            <TableOfContents headings={headings} />
          ) : null
        ) : (
          <Tags className="onload-animation" style={{ animationDelay: '150ms' }} />
        )}
      </div>
    </aside>
  );
}

/** 右侧边栏组件 - 显示分类 */
function RightSidebar() {
  return (
    <aside className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-4 flex flex-col w-full gap-4">
        <ContributionCalendar className="onload-animation" style={{ animationDelay: '100ms' }} />
        <Categories className="onload-animation" style={{ animationDelay: '150ms' }} />
      </div>
    </aside>
  );
}

export function MainLayout() {
  const { headings, isArticleLoading } = useTocStore();
  const location = useLocation();

  // 判断是否为文章详情页
  const isArticlePage = useMemo(() => {
    return /^\/articles\//.test(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区域 - 三栏布局 */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-6 md:px-8 py-4">
        <div className="flex gap-4 justify-center">
          {/* 左侧边栏 - Profile + TOC */}
          <LeftSidebar
            isArticlePage={isArticlePage}
            headings={headings}
            isLoading={isArticleLoading}
          />

          {/* 主内容区 */}
          <main className="min-w-0 flex-1 max-w-[50rem] flex flex-col gap-4">
            <Outlet />
          </main>

          {/* 右侧边栏 - 分类 + 标签（所有页面都显示） */}
          <RightSidebar />
        </div>
      </div>

      {/* 底部页脚 */}
      <Footer />
    </div>
  );
}