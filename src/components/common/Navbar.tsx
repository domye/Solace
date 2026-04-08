/**
 * 导航栏组件
 *
 * 结构：
 * ┌─────────────────────────────────────────┐
 * │ Logo │ 导航链接(桌面) │ 工具栏 │ 菜单(移动) │
 * └─────────────────────────────────────────┘
 *
 * 功能：
 * - Logo 首页链接
 * - 桌面端：导航链接 + 认证按钮
 * - 移动端：汉堡菜单
 * - 工具栏：搜索、主题、色相选择器
 */

import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ThemeToggle } from './ThemeToggle';
import { SearchModal } from '../widget/SearchModal';
import { HuePicker } from '../widget/HuePicker';
import { useState, useRef, useEffect } from 'react';

/** 导航链接配置 */
const navLinks = [
  { name: '首页', path: '/', icon: 'material-symbols:home-outline-rounded' },
  { name: '归档', path: '/archive', icon: 'material-symbols:archive-outline-rounded' },
];

/** 菜单项组件（移动端使用） */
function MenuItem({
  link,
  onClick,
  onLogout
}: {
  link: { name: string; path: string; icon?: string };
  onClick?: () => void;
  onLogout?: () => void;
}) {
  const content = (
    <>
      <span className="text-75 font-bold group-hover:text-[var(--primary)] transition">{link.name}</span>
      <Icon icon={link.icon || 'material-symbols:chevron-right-rounded'} className="text-lg text-[var(--primary)]" />
    </>
  );

  if (link.path === 'logout') {
    return (
      <button
        onClick={onLogout}
        className="w-full group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
          hover:bg-[var(--btn-plain-bg-hover)] transition text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={link.path}
      onClick={onClick}
      className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg
        hover:bg-[var(--btn-plain-bg-hover)] transition"
    >
      {content}
    </Link>
  );
}

/** 用户菜单组件（已登录状态） */
function UserMenu({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-9 rounded-[var(--radius-medium)]
          bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-regular-bg-hover)]
          transition-colors font-medium text-sm"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)]
          flex items-center justify-center overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.nickname || user.username} className="w-full h-full object-cover" />
          ) : (
            <Icon icon="material-symbols:person-outline-rounded" className="text-white text-sm" />
          )}
        </div>
        <span className="text-[var(--text-75)] max-w-[80px] truncate">
          {user?.nickname || user?.username || '用户'}
        </span>
        <Icon
          icon={isOpen ? 'material-symbols:expand-less-rounded' : 'material-symbols:expand-more-rounded'}
          className="text-base text-[var(--text-50)]"
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-[var(--radius-medium)]
          bg-[var(--card-bg)] shadow-lg border border-[var(--border-medium)] z-50 fade-in-down">
          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--btn-plain-bg-hover)]
              transition-colors text-sm text-[var(--text-75)]"
          >
            <Icon icon="material-symbols:admin-panel-settings-outline-rounded" className="text-lg text-[var(--primary)]" />
            管理后台
          </Link>
          <div className="h-px bg-[var(--line-divider)] mx-2 my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--btn-plain-bg-hover)]
              transition-colors text-sm text-[var(--text-75)] text-left"
          >
            <Icon icon="material-symbols:logout-rounded" className="text-lg text-[var(--primary)]" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}

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

  // 移动端菜单项（包含认证相关）
  const mobileMenuItems = isAuthenticated
    ? [
        ...navLinks,
        { name: '管理后台', path: '/admin' },
        { name: '退出登录', path: 'logout', icon: 'material-symbols:logout-rounded' },
      ]
    : [...navLinks, { name: '登录', path: '/login' }];

  return (
    <>
      <div id="navbar" className="z-50 onload-animation">
        {/* 动画背景 */}
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
                {l.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to="/admin" className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95">
                管理后台
              </Link>
            )}
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-1">
            {/* 搜索按钮 */}
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

            {/* 主题切换 */}
            <ThemeToggle />

            {/* 认证按钮（桌面端） */}
            <div className="hidden md:block relative">
              {isAuthenticated ? (
                <UserMenu onLogout={handleLogout} />
              ) : (
                <Link
                  to="/login"
                  className="btn-regular px-4 h-9 rounded-[var(--radius-medium)] font-medium text-sm flex items-center gap-1.5 hover:shadow-sm transition-shadow"
                >
                  <Icon icon="material-symbols:login-rounded" className="text-lg" />
                  登录
                </Link>
              )}
            </div>

            {/* 移动端菜单按钮 */}
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
            {mobileMenuItems.map((item) => (
              <MenuItem
                key={item.path}
                link={item}
                onClick={() => setShowMobileMenu(false)}
                onLogout={handleLogout}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 搜索模态框 */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}