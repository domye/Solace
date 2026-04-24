/**
 * 个人信息组件
 */

import { Link } from "react-router-dom";
import { useOwner } from "@/hooks";
import { LazyImage, SafeIcon } from "@/components/common/ui";

export function Profile() {
	const { data: owner } = useOwner();

	const displayName = owner?.nickname || "博主";
	const displayBio = owner?.bio || "欢迎来到我的博客！";
	const displayAvatar = owner?.avatar_url;

	return (
		<div className="card-base p-2 lg:p-2.5 onload-animation">
			<Link
				to="/pages/about"
				className="group block relative mx-auto mt-0.5 lg:mx-0 lg:mt-0 mb-1.5 lg:mb-2 max-w-[7rem] lg:max-w-none aspect-square overflow-hidden rounded-lg active:scale-95"
				aria-label="关于我"
			>
				<div className="absolute inset-0 pointer-events-none group-hover:bg-black/30 group-active:bg-black/50 z-50 flex items-center justify-center">
					<SafeIcon
						icon="fa6-regular:address-card"
						size="1.75rem"
						className="opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 text-white transition lg:!size-[2.5rem]"
					/>
				</div>
				{displayAvatar ? (
					<LazyImage
						src={displayAvatar}
						alt="头像"
						className="w-full h-full object-cover rounded-lg"
						wrapperClassName="w-full h-full"
						effect="blur"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-lg flex items-center justify-center">
						<SafeIcon
							icon="material-symbols:person-outline-rounded"
							size="1.5rem"
							className="text-white lg:!size-[2rem]"
						/>
					</div>
				)}
			</Link>

			<div className="px-1 lg:px-1.5">
				<div className="font-bold text-base lg:text-lg text-center mb-0.5 text-90">
					{displayName}
				</div>
				<div className="h-0.5 w-3 lg:w-4 bg-[var(--primary)] mx-auto rounded-full mb-1 lg:mb-1.5" />
				<div className="text-center text-50 text-xs lg:text-sm mb-1.5 lg:mb-2">{displayBio}</div>

				<div className="flex gap-1.5 lg:gap-2 justify-center">
					{owner?.github_url && (
						<a
							href={owner.github_url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-50 hover:bg-[var(--primary)] hover:text-white transition-all"
							aria-label="GitHub"
						>
							<SafeIcon icon="fa6-brands:github" size="1rem" className="lg:!size-[1.125rem]" />
						</a>
					)}
					{owner?.email && (
						<a
							href={`mailto:${owner.email}`}
							className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-50 hover:bg-[var(--primary)] hover:text-white transition-all"
							aria-label="邮箱"
						>
							<SafeIcon
								icon="material-symbols:mail-outline-rounded"
								size="1rem"
								className="lg:!size-[1.125rem]"
							/>
						</a>
					)}
					{owner?.rss_url && (
						<a
							href={owner.rss_url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-50 hover:bg-[var(--primary)] hover:text-white transition-all"
							aria-label="RSS"
						>
							<SafeIcon
								icon="material-symbols:rss-feed-rounded"
								size="1rem"
								className="lg:!size-[1.125rem]"
							/>
						</a>
					)}
					{owner?.sitemap_url && (
						<a
							href={owner.sitemap_url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-50 hover:bg-[var(--primary)] hover:text-white transition-all"
							aria-label="Sitemap"
						>
							<SafeIcon
								icon="material-symbols:map-outline-rounded"
								size="1rem"
								className="lg:!size-[1.125rem]"
							/>
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
