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
 * ├─────────────┴─────────────────────┴─────────────────────┤
 * │              移动端侧边栏内容（lg以下显示）               │
 * ├─────────────────────────────────────────────────────────┤
 * │                       Footer                            │
 * └─────────────────────────────────────────────────────────┘
 *
 * 响应式：
 * - 移动端：单栏（主内容 + 底部侧边栏内容 + Footer）
 * - 平板：双栏（左侧边栏 + 主内容）
 * - 桌面：三栏（左侧边栏 + 主内容 + 右侧边栏）
 */

import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { TableOfContents } from '@/components/widget';
import { Profile, Categories, Tags, ContributionCalendar } from '@/components/widget';
import { useTocStore } from '@/stores';
import { useMediaQuery } from '@/hooks';
import { useMemo } from 'react';

/** 左侧边栏组件 */
interface LeftSidebarProps {
  isArticlePage: boolean;
  headings: { id: string; text: string; depth: number }[];
}

function LeftSidebar({ isArticlePage, headings }: LeftSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0">
      {/* 顶部组件区域 - Profile 始终显示 */}
      <div className="flex flex-col w-full gap-4 mb-4">
        <Profile />
      </div>

      {/* 吸顶组件区域 */}
      <div className="sticky top-4 flex flex-col w-full gap-4">
        {/* Tags 始终显示 */}
        <Tags className="onload-animation" style={{ animationDelay: '150ms' }} />

        {/* 文章详情页显示 TOC（只在有标题时显示） */}
        {isArticlePage && headings.length > 0 && (
          <TableOfContents headings={headings} />
        )}
      </div>
    </aside>
  );
}

/** 右侧边栏组件 - 显示分类 */
function RightSidebar() {
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-4 flex flex-col w-full gap-4">
        <ContributionCalendar className="onload-animation" style={{ animationDelay: '100ms' }} />
        <Categories className="onload-animation" style={{ animationDelay: '150ms' }} />
      </div>
    </aside>
  );
}

/** 移动端底部侧边栏内容 - Mizuki 风格 */
function MobileBottomSidebar() {
  return (
    <div className="lg:hidden flex flex-col gap-4 mt-4">
      {/* Profile */}
      <Profile />

      {/* 贡献日历和分类并排显示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ContributionCalendar className="onload-animation" />
        <Categories className="onload-animation" />
      </div>

      {/* Tags */}
      <Tags className="onload-animation" />
    </div>
  );
}

export function MainLayout() {
  const { headings } = useTocStore();
  const location = useLocation();

  // 响应式断点检测
  const isLgOrLarger = useMediaQuery('(min-width: 1024px)');
  const isXlOrLarger = useMediaQuery('(min-width: 1280px)');

  // 判断是否为文章详情页
  const isArticlePage = useMemo(() => {
    return /^\/articles\//.test(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区域 - 三栏布局 */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-4 py-4">
        <div className="flex gap-4">
          {/* 左侧边栏 - Profile + TOC（lg 以上显示） */}
          {isLgOrLarger && (
            <LeftSidebar
              isArticlePage={isArticlePage}
              headings={headings}
            />
          )}

          {/* 主内容区 */}
          <main className="min-w-0 flex-1 flex flex-col gap-4">
            <Outlet />
          </main>

          {/* 右侧边栏 - 分类 + 标签（xl 以上显示） */}
          {isXlOrLarger && <RightSidebar />}
        </div>

        {/* 移动端底部侧边栏 - 在主内容下方、Footer 上方显示 */}
        <MobileBottomSidebar />
      </div>

      {/* 底部页脚 */}
      <Footer />
    </div>
  );
}
