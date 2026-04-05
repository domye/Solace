import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '@/components/common';
import { SideBar } from '@/components/widget';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <Navbar />

      {/* 主内容区 */}
      <div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-0 md:px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[17.5rem_1fr] gap-4">
          {/* 侧边栏 - 桌面端显示在左侧 */}
          <aside className="hidden lg:block">
            <SideBar />
          </aside>

          {/* 主内容区 */}
          <main className="min-w-0">
            <div className="flex flex-col rounded-[var(--radius-large)] bg-[var(--card-bg)] py-1 md:py-0 md:bg-transparent md:gap-4 mb-4 lg:mb-0">
              <Outlet />
            </div>
            {/* 桌面端页脚 */}
            <div className="hidden lg:block mt-4">
              <Footer />
            </div>
          </main>
        </div>

        {/* 移动端页脚 */}
        <div className="block lg:hidden mt-4">
          <Footer />
        </div>
      </div>
    </div>
  );
}