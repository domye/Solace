import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ThemeToggle } from './ThemeToggle';
import { SearchModal } from '../widget/SearchModal';
import { HuePicker } from '../widget/HuePicker';
import { useState } from 'react';

const navLinks = [
  { name: '首页', path: '/' },
  { name: '归档', path: '/archive' },
];

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showHuePicker, setShowHuePicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/');
    setShowMobileMenu(false);
  };

  return (
    <>
      <div id="navbar" className="z-50 onload-animation">
        {/* 用于 onload 动画的背景 */}
        <div className="absolute h-8 left-0 right-0 -top-8 bg-[var(--card-bg)] transition" />

        <div className="card-base !overflow-visible max-w-[var(--page-width)] h-[4.5rem] !rounded-t-none mx-auto flex items-center justify-between px-4">
          {/* Logo */}
          <Link
            to="/"
            className="btn-plain scale-animation rounded-lg h-[3.25rem] px-5 font-bold active:scale-95"
          >
            <div className="flex flex-row text-[var(--primary)] items-center text-md">
              <Icon icon="material-symbols:home-outline-rounded" className="text-[1.75rem] mb-1 mr-2" />
              <span>Blog</span>
            </div>
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
              >
                <div className="flex items-center">
                  {l.name}
                </div>
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/admin"
                className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
              >
                管理后台
              </Link>
            )}
          </div>

          {/* 右侧区域 */}
          <div className="flex">
            {/* 搜索 */}
            <button
              onClick={() => setShowSearch(true)}
              className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
              aria-label="搜索"
            >
              <Icon icon="material-symbols:search-rounded" className="text-[1.25rem]" />
            </button>

            {/* 色相选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowHuePicker(!showHuePicker)}
                className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
                aria-label="显示设置"
              >
                <Icon icon="material-symbols:palette-outline" className="text-[1.25rem]" />
              </button>
              <HuePicker isOpen={showHuePicker} />
            </div>

            <ThemeToggle />

            {/* 认证相关 */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center">
                <button
                  onClick={handleLogout}
                  className="btn-plain scale-animation rounded-lg h-11 px-3 active:scale-95 text-sm"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/login"
                  className="btn-plain scale-animation rounded-lg h-11 px-3 active:scale-95 text-sm"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn-regular scale-animation rounded-lg h-11 px-3 active:scale-95 text-sm"
                >
                  注册
                </Link>
              </div>
            )}

            {/* 移动端菜单切换按钮 */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90 md:hidden"
              aria-label="菜单"
            >
              <Icon icon="material-symbols:menu-rounded" className="text-[1.25rem]" />
            </button>
          </div>

          {/* 移动端菜单面板 */}
          <div
            className={`float-panel absolute top-full left-4 right-4 mt-1 p-2 md:hidden transition-all ${
              showMobileMenu ? '' : 'float-panel-closed'
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setShowMobileMenu(false)}
                className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
                  hover:bg-[var(--btn-plain-bg-hover)] transition"
              >
                <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
                  {link.name}
                </span>
                <Icon
                  icon="material-symbols:chevron-right-rounded"
                  className="text-lg text-[var(--primary)]"
                />
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setShowMobileMenu(false)}
                  className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
                    hover:bg-[var(--btn-plain-bg-hover)] transition"
                >
                  <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
                    管理后台
                  </span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="text-lg text-[var(--primary)]"
                  />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
                    hover:bg-[var(--btn-plain-bg-hover)] transition text-left"
                >
                  <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
                    退出登录
                  </span>
                  <Icon
                    icon="material-symbols:logout-rounded"
                    className="text-lg text-[var(--primary)]"
                  />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
                    hover:bg-[var(--btn-plain-bg-hover)] transition"
                >
                  <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
                    登录
                  </span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="text-lg text-[var(--primary)]"
                  />
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
                    hover:bg-[var(--btn-plain-bg-hover)] transition"
                >
                  <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
                    注册
                  </span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="text-lg text-[var(--primary)]"
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 搜索模态框 */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}