/**
 * 导航栏组件
 */
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useClickOutside, useNavPages } from "@/hooks";
import { ThemeToggle, SafeIcon } from "@/components/common/ui";
import { SearchModal } from "@/components/widget";
import { useState, useRef, useMemo, useCallback } from "react";

// ============ 常量定义 ============
const staticNavLinks = [
	{ name: "首页", path: "/", icon: "material-symbols:home-outline-rounded" },
	{
		name: "归档",
		path: "/archive",
		icon: "material-symbols:archive-outline-rounded",
	},
];

/** 图标按钮 - 用于工具栏 */
function IconButton({
	icon,
	size = "1.25rem",
	onClick,
	label,
}: {
	icon: string;
	size?: string;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			onClick={onClick}
			className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 w-11"
			aria-label={label}
		>
			<SafeIcon icon={icon} size={size} />
		</button>
	);
}

/** Logo 品牌 */
function BrandLogo() {
	return (
		<Link
			to="/"
			className="btn-plain scale-animation rounded-[var(--radius-small)] h-[3.25rem] px-5 font-bold"
		>
			<div className="flex items-center text-md text-[var(--primary)]">
				<SafeIcon
					icon="material-symbols:home-outline-rounded"
					size="1.75rem"
					className="mb-1 mr-2"
				/>
				<span>Solace</span>
			</div>
		</Link>
	);
}

/** 桌面端导航链接 */
function DesktopNavLink({ path, name }: { path: string; name: string }) {
	return (
		<Link
			to={path}
			className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 font-bold px-5"
		>
			{name}
		</Link>
	);
}

/** 工具栏 */
function Toolbar({
	onSearch,
	onToggleMobileMenu,
	onLogout,
	mobileMenuButtonRef,
	isAuthenticated,
}: {
	onSearch: () => void;
	onToggleMobileMenu: () => void;
	onLogout: () => void;
	mobileMenuButtonRef: React.RefObject<HTMLButtonElement>;
	isAuthenticated: boolean;
}) {
	return (
		<div className="flex items-center gap-1">
			<IconButton
				icon="material-symbols:search-rounded"
				onClick={onSearch}
				label="搜索"
			/>

			<ThemeToggle />

			<div className="hidden md:block relative">
				{isAuthenticated ? (
					<UserMenu onLogout={onLogout} />
				) : (
					<Link
						to="/login"
						className="btn-regular px-4 h-9 font-medium text-sm flex items-center gap-1.5"
					>
						<SafeIcon icon="material-symbols:login-rounded" size="1.125rem" />
						登录
					</Link>
				)}
			</div>

			<button
				ref={mobileMenuButtonRef}
				onClick={onToggleMobileMenu}
				className="btn-plain scale-animation rounded-[var(--radius-small)] w-11 h-11 md:hidden"
				aria-label="菜单"
			>
				<SafeIcon icon="material-symbols:menu-rounded" size="1.25rem" />
			</button>
		</div>
	);
}

/** 移动端菜单面板 */
function MobileMenuPanel({
	isOpen,
	items,
	onClose,
	onLogout,
	menuRef,
}: {
	isOpen: boolean;
	items: Array<{ name: string; path: string; icon?: string }>;
	onClose: () => void;
	onLogout: () => void;
	menuRef: React.RefObject<HTMLDivElement>;
}) {
	return (
		<div
			ref={menuRef}
			className={`absolute top-full left-4 right-4 p-2 md:hidden transition-all rounded-[var(--radius-large)] bg-white dark:bg-[oklch(0.18_0.015_var(--hue))] border-2 border-[var(--showa-border-color)] shadow-[4px_4px_0_var(--showa-shadow-color)] z-50 ${isOpen ? "" : "float-panel-closed"}`}
		>
			{items.map((item) => (
				<MobileMenuItem
					key={item.path}
					link={item}
					onClose={onClose}
					onLogout={onLogout}
				/>
			))}
		</div>
	);
}

/** 下拉菜单项 */
function DropdownMenuItem({
	path,
	icon,
	name,
	onClick,
}: {
	path?: string;
	icon: string;
	name: string;
	onClick: () => void;
}) {
	const baseClass =
		"flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--btn-plain-bg-hover)] transition-colors";

	const content = (
		<>
			<SafeIcon icon={icon} size="1.125rem" className="text-[var(--primary)]" />
			<span className="text-sm text-[var(--text-75)]">{name}</span>
		</>
	);

	if (!path) {
		return (
			<button onClick={onClick} className={`${baseClass} w-full text-left`}>
				{content}
			</button>
		);
	}

	return (
		<Link to={path} onClick={onClick} className={baseClass}>
			{content}
		</Link>
	);
}

/** 移动端菜单项 */
function MobileMenuItem({
	link,
	onClose,
	onLogout,
}: {
	link: { name: string; path: string; icon?: string };
	onClose: () => void;
	onLogout: () => void;
}) {
	const isLogout = link.path === "logout";
	const content = (
		<>
			<span className="font-bold group-hover:text-[var(--primary)]">
				{link.name}
			</span>
			<SafeIcon
				icon={link.icon || "material-symbols:chevron-right-rounded"}
				size="1.125rem"
				className="text-[var(--primary)]"
			/>
		</>
	);

	const baseClass =
		"group flex justify-between items-center py-2 pl-3 pr-1 rounded-[var(--radius-small)] hover:bg-[var(--btn-plain-bg-hover)]";

	if (isLogout) {
		return (
			<button onClick={onLogout} className={`${baseClass} w-full text-left`}>
				{content}
			</button>
		);
	}

	return (
		<Link to={link.path} onClick={onClose} className={baseClass}>
			{content}
		</Link>
	);
}

/** 用户下拉菜单 */
function UserMenu({ onLogout }: { onLogout: () => void }) {
	const { user } = useAuthStore();
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useClickOutside(ref, () => setIsOpen(false), isOpen);

	const closeMenu = useCallback(() => setIsOpen(false), []);
	const handleLogout = useCallback(() => {
		setIsOpen(false);
		onLogout();
	}, [onLogout]);

	const displayName = user?.nickname || user?.username || "用户";

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="btn-regular flex items-center gap-2 px-3 h-9 text-sm"
			>
				<div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center overflow-hidden">
					{user?.avatar_url ? (
						<img
							src={user.avatar_url}
							alt={displayName}
							className="w-full h-full object-cover"
						/>
					) : (
						<SafeIcon
							icon="material-symbols:person-outline-rounded"
							size="0.875rem"
							className="text-white"
						/>
					)}
				</div>
				<span className="text-[var(--text-75)] max-w-[80px] truncate">
					{displayName}
				</span>
				<SafeIcon
					icon={
						isOpen
							? "material-symbols:expand-less-rounded"
							: "material-symbols:expand-more-rounded"
					}
					size="1rem"
					className="text-[var(--text-50)]"
				/>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-[var(--radius-large)] bg-white dark:bg-[oklch(0.18_0.015_var(--hue))] border border-[var(--showa-border-color)] shadow-[4px_4px_0_var(--showa-shadow-color)] z-50 fade-in-down">
					<DropdownMenuItem
						path="/admin"
						icon="material-symbols:admin-panel-settings-outline-rounded"
						name="管理后台"
						onClick={closeMenu}
					/>
					<div className="h-px bg-[var(--line-divider)] mx-2 my-1" />
					<DropdownMenuItem
						icon="material-symbols:logout-rounded"
						name="退出登录"
						onClick={handleLogout}
					/>
				</div>
			)}
		</div>
	);
}

export function Navbar() {
	const { isAuthenticated } = useAuthStore();
	const navigate = useNavigate();
	const [showSearch, setShowSearch] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);

	const { data: navPages } = useNavPages();

	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

	useClickOutside(
		mobileMenuRef,
		() => setShowMobileMenu(false),
		showMobileMenu,
		mobileMenuButtonRef,
	);

	// 回调函数 - 使用 useCallback 避免重复创建
	const handleLogout = useCallback(() => {
		useAuthStore.getState().logout();
		navigate("/");
	}, [navigate]);

	const openSearch = useCallback(() => setShowSearch(true), []);
	const closeSearch = useCallback(() => setShowSearch(false), []);
	const toggleMobileMenu = useCallback(
		() => setShowMobileMenu((prev) => !prev),
		[],
	);
	const closeMobileMenu = useCallback(() => setShowMobileMenu(false), []);

	// 合并静态导航链接和动态页面链接
	const navLinks = useMemo(() => {
		const pageLinks = (navPages || []).map((page) => ({
			name: page.title,
			path: `/pages/${page.slug}`,
			icon: "material-symbols:web-outline-rounded",
		}));
		return [...staticNavLinks, ...pageLinks];
	}, [navPages]);

	// 桌面端导航
	const desktopNavLinks = navLinks;

	// 移动端菜单项
	const mobileMenuItems = useMemo(
		() =>
			isAuthenticated
				? [
						...navLinks,
						{ name: "管理后台", path: "/admin" },
						{
							name: "退出登录",
							path: "logout",
							icon: "material-symbols:logout-rounded",
						},
					]
				: [...navLinks, { name: "登录", path: "/login" }],
		[isAuthenticated, navLinks],
	);

	return (
		<>
			<div
				id="navbar"
				className="relative z-50 mt-2 max-w-[var(--page-width)] mx-auto w-full px-4"
			>
				<div className="absolute h-8 -left-4 -right-4 -top-8 bg-[var(--page-bg)]" />

				<div className="card-base !overflow-visible h-[4.5rem] flex items-center justify-between px-4">
					<BrandLogo />

					<nav className="hidden md:flex">
						{desktopNavLinks.map((link) => (
							<DesktopNavLink
								key={link.path}
								path={link.path}
								name={link.name}
							/>
						))}
					</nav>

				<Toolbar
					onSearch={openSearch}
					onToggleMobileMenu={toggleMobileMenu}
					onLogout={handleLogout}
					mobileMenuButtonRef={mobileMenuButtonRef}
					isAuthenticated={isAuthenticated}
				/>
				</div>

				<MobileMenuPanel
					isOpen={showMobileMenu}
					items={mobileMenuItems}
					onClose={closeMobileMenu}
					onLogout={handleLogout}
					menuRef={mobileMenuRef}
				/>
			</div>

			<SearchModal isOpen={showSearch} onClose={closeSearch} />
		</>
	);
}
