/**
 * 主布局组件
 *
 * 结构：
 * ┌─────────────────────────────────────┐
 * │            Navbar                   │
 * ├─────────┬───────────────┬───────────┤
 * │ SideBar │   MainContent │   TOC     │
 * │         │   (Outlet)    │ (optional)│
 * └─────────┴───────────────┴───────────┤
 * │              Footer                 │
 * └─────────────────────────────────────┘
 *
 * 文章详情页：Profile + TOC（有标题时）或 Profile + 分类/标签
 * 其他页面：Profile + 分类 + 标签
 */

import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { TableOfContents } from '@/components/widget';
import { Profile, Categories, Tags } from '@/components/widget';
import { useTocStore } from '@/stores';
import { useMemo } from 'react';

export function MainLayout() {
  const { headings } = useTocStore();
  const location = useLocation();

  // 判断是否为文章详情页
  const isArticlePage = useMemo(() => {
    return /^\/articles\//.test(location.pathname);
  }, [location.pathname]);

  // 文章详情页有 TOC 时显示 TOC，否则显示分类/标签
  const showToc = isArticlePage && headings.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区域 */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-6 md:px-8 py-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[17.5rem_1fr] gap-4">
          {/* 左侧边栏 - 仅桌面端显示 */}
          <aside className="hidden lg:block">
            {/* 个人信息（始终显示） */}
            <div className="flex flex-col w-full gap-4 mb-4">
              <Profile />
            </div>

            {/* 文章详情页：TOC 或 分类/标签 */}
            {showToc ? (
              <div className="transition-all duration-700 flex flex-col w-full gap-4 top-4 sticky top-4">
                <TableOfContents headings={headings} />
              </div>
            ) : (
              <div className="transition-all duration-700 flex flex-col w-full gap-4 top-4 sticky top-4">
                <Categories className="onload-animation" style={{ animationDelay: '150ms' }} />
                <Tags className="onload-animation" style={{ animationDelay: '200ms' }} />
              </div>
            )}
          </aside>

          {/* 主内容区 */}
          <main className="min-w-0 flex flex-col gap-4">
            <Outlet />
          </main>
        </div>

        {/* 右侧目录 - 仅超宽屏且非文章页显示 */}
        {!isArticlePage && headings.length > 0 && (
          <div className="hidden 2xl:block absolute top-0 -right-[var(--toc-width)] w-[var(--toc-width)] h-full">
            <div className="sticky top-20">
              <TableOfContents headings={headings} />
            </div>
          </div>
        )}
      </div>

      {/* 底部页脚 */}
      <Footer />
    </div>
  );
}