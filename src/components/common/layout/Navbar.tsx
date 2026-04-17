/**
 * 导航栏组件
 */

import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useClickOutside, useNavPages } from "@/hooks";
import { ThemeToggle, SafeIcon } from "@/components/common/ui";
import { SearchModal, HuePicker } from "@/components/widget";
import { useState, useRef, useMemo } from "react";

// 固定导航链接
const staticNavLinks = [
	{ name: "首页", path: "/", icon: "material-symbols:home-outline-rounded" },
	{
		name: "归档",
		path: "/archive",
		icon: "material-symbols:archive-outline-rounded",
	},
];

function MenuItem({
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
			<span className="text-75 font-bold group-hover:text-[var(--primary)] transition">
				{link.name}
			</span>
			<SafeIcon
				icon={link.icon || "material-symbols:chevron-right-rounded"}
				size="1.125rem"
				className="text-[var(--primary)]"
			/>
		</>
	);

	if (isLogout) {
		return (
			<button
				onClick={onLogout}
				className="w-full group flex justify-between items-center py-2 pl-3 pr-1 rounded-[var(--radius-small)] hover:bg-[var(--btn-plain-bg-hover)] transition text-left"
			>
				{content}
			</button>
		);
	}

	return (
		<Link
			to={link.path}
			onClick={onClose}
			className="group flex justify-between items-center py-2 pl-3 pr-1 rounded-[var(--radius-small)] hover:bg-[var(--btn-plain-bg-hover)] transition"
		>
			{content}
		</Link>
	);
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
	const { user } = useAuthStore();
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useClickOutside(ref, () => setIsOpen(false), isOpen);

	const closeAndLogout = () => {
		setIsOpen(false);
		onLogout();
	};

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 h-9 rounded-[var(--radius-small)] bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-regular-bg-hover)] transition-colors font-medium text-sm border border-[var(--showa-border-color)] shadow-[2px_2px_0_var(--showa-shadow-color)]"
			>
				<div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center overflow-hidden">
					{user?.avatar_url ? (
						<img
							src={user.avatar_url}
							alt={user.nickname || user.username}
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
					{user?.nickname || user?.username || "用户"}
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
				<div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-[var(--radius-large)] bg-[var(--card-bg)] border border-[var(--showa-border-color)] shadow-[4px_4px_0_var(--showa-shadow-color)] z-50 fade-in-down">
					<Link
						to="/admin"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-sm text-[var(--text-75)]"
					>
						<SafeIcon
							icon="material-symbols:admin-panel-settings-outline-rounded"
							size="1.125rem"
							className="text-[var(--primary)]"
						/>
						管理后台
					</Link>
					<div className="h-px bg-[var(--line-divider)] mx-2 my-1" />
					<button
						onClick={closeAndLogout}
						className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-sm text-[var(--text-75)] text-left"
					>
						<SafeIcon
							icon="material-symbols:logout-rounded"
							size="1.125rem"
							className="text-[var(--primary)]"
						/>
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

	// 获取动态导航页面
	const { data: navPages } = useNavPages();

	const huePickerRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

	useClickOutside(huePickerRef, () => setShowHuePicker(false), showHuePicker);
	useClickOutside(
		mobileMenuRef,
		() => setShowMobileMenu(false),
		showMobileMenu,
		mobileMenuBtnRef,
	);

	const handleLogout = () => {
		useAuthStore.getState().logout();
		navigate("/");
	};

	const closeMobileMenu = () => setShowMobileMenu(false);

	// 合并静态导航链接和动态页面链接
	const navLinks = useMemo(() => {
		const pageLinks = (navPages || []).map((page) => ({
			name: page.title,
			path: `/pages/${page.slug}`,
			icon: "material-symbols:web-outline-rounded",
		}));
		return [...staticNavLinks, ...pageLinks];
	}, [navPages]);

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
				<div className="absolute h-8 -left-4 -right-4 -top-8 bg-[var(--page-bg)] transition" />

				<div className="card-base !overflow-visible h-[4.5rem] !rounded-t-none flex items-center justify-between px-4">
					<Link
						to="/"
						className="btn-plain scale-animation rounded-[var(--radius-small)] h-[3.25rem] px-5 font-bold"
					>
						<div className="flex flex-row text-[var(--primary)] items-center text-md">
							<SafeIcon
								icon="material-symbols:home-outline-rounded"
								size="1.75rem"
								className="mb-1 mr-2"
							/>
							<span>Blog</span>
						</div>
					</Link>

					<div className="hidden md:flex">
						{navLinks.map((l) => (
							<Link
								key={l.path}
								to={l.path}
								className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 font-bold px-5"
							>
								{l.name}
							</Link>
						))}
						{isAuthenticated && (
							<Link
								to="/admin"
								className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 font-bold px-5"
							>
								管理后台
							</Link>
						)}
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={() => setShowSearch(true)}
							className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 w-11"
							aria-label="搜索"
						>
							<SafeIcon icon="material-symbols:search-rounded" size="1.25rem" />
						</button>

						<div ref={huePickerRef} className="relative">
							<button
								onClick={() => setShowHuePicker(!showHuePicker)}
								className="btn-plain scale-animation rounded-[var(--radius-small)] h-11 w-11"
								aria-label="显示设置"
							>
								<SafeIcon
									icon="material-symbols:palette-outline"
									size="1.25rem"
								/>
							</button>
							<HuePicker isOpen={showHuePicker} />
						</div>

						<ThemeToggle />

						<div className="hidden md:block relative">
							{isAuthenticated ? (
								<UserMenu onLogout={handleLogout} />
							) : (
								<Link
									to="/login"
									className="btn-regular px-4 h-9 font-medium text-sm flex items-center gap-1.5"
								>
									<SafeIcon
										icon="material-symbols:login-rounded"
										size="1.125rem"
									/>
									登录
								</Link>
							)}
						</div>

						<button
							ref={mobileMenuBtnRef}
							onClick={() => setShowMobileMenu(!showMobileMenu)}
							className="btn-plain scale-animation rounded-[var(--radius-small)] w-11 h-11 md:hidden"
							aria-label="菜单"
						>
							<SafeIcon icon="material-symbols:menu-rounded" size="1.25rem" />
						</button>
					</div>
				</div>

				<div
					ref={mobileMenuRef}
					className={`float-panel absolute top-full left-4 right-4 p-2 md:hidden transition-all ${showMobileMenu ? "" : "float-panel-closed"}`}
				>
					{mobileMenuItems.map((item) => (
						<MenuItem
							key={item.path}
							link={item}
							onClose={closeMobileMenu}
							onLogout={handleLogout}
						/>
					))}
				</div>
			</div>

			<SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
		</>
	);
}
