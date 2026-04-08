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
 */

import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { SideBar, TableOfContents } from '@/components/widget';
import { useTocStore } from '@/stores';

export function MainLayout() {
  const { headings } = useTocStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区域 */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-0 md:px-4 py-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[17.5rem_1fr] gap-4">
          {/* 左侧边栏 - 仅桌面端显示 */}
          <aside className="hidden lg:block">
            <SideBar />
          </aside>

          {/* 主内容区 */}
          <main className="min-w-0">
            <div className="flex flex-col rounded-[var(--radius-large)] bg-[var(--card-bg)] py-1 md:py-0 md:bg-transparent md:gap-4 mb-4 lg:mb-0">
              <Outlet />
            </div>
          </main>
        </div>

        {/* 右侧目录 - 仅超宽屏显示 */}
        {headings.length > 0 && (
          <div className="hidden 2xl:block absolute top-0 -right-[var(--toc-width)] w-[var(--toc-width)] h-full">
            <div className="sticky top-20">
              <TableOfContents headings={headings} className="bg-transparent" />
            </div>
          </div>
        )}
      </div>

      {/* 底部页脚 */}
      <div className="max-w-[var(--page-width)] mx-auto w-full px-0 md:px-4">
        <Footer />
      </div>
    </div>
  );
}