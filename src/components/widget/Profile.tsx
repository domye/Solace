/**
 * 个人信息组件
 */

import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useOwner } from "@/hooks";
import { LazyImage, SafeIcon } from "@/components/common/ui";

export function Profile() {
	const { isAuthenticated } = useAuthStore();
	const { data: owner } = useOwner();

	const displayName = owner?.nickname || "博主";
	const displayBio = owner?.bio || "欢迎来到我的博客！";
	const displayAvatar = owner?.avatar_url;
	const githubUrl = owner?.github_url;

	return (
		<div className="card-base p-2.5 onload-animation">
			<Link
				to="/about"
				className="group block relative mx-auto mt-0.5 lg:mx-0 lg:mt-0 mb-2 max-w-[10rem] lg:max-w-none aspect-square overflow-hidden rounded-lg active:scale-95"
			>
				<div className="absolute inset-0 pointer-events-none group-hover:bg-black/30 group-active:bg-black/50 z-50 flex items-center justify-center">
					<SafeIcon
						icon="fa6-regular:address-card"
						size="2.5rem"
						className="opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 text-white transition"
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
							size="2rem"
							className="text-white"
						/>
					</div>
				)}
			</Link>

			<div className="px-1.5">
				<div className="font-bold text-lg text-center mb-0.5 text-90">
					{displayName}
				</div>
				<div className="h-0.5 w-4 bg-[var(--primary)] mx-auto rounded-full mb-1.5" />
				<div className="text-center text-50 text-sm mb-2">{displayBio}</div>

				<div className="flex flex-wrap gap-1.5 justify-center mb-0.5">
					{isAuthenticated ? (
						<Link
							to="/admin"
							className="btn-regular rounded-md h-8 gap-1.5 px-2.5 font-medium text-sm active:scale-95 flex items-center"
						>
							<SafeIcon
								icon="material-symbols:dashboard-outline-rounded"
								size="1rem"
							/>
							管理后台
						</Link>
					) : (
						githubUrl && (
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="btn-regular rounded-md h-8 gap-1.5 px-2.5 font-medium text-sm active:scale-95 flex items-center"
								aria-label="GitHub"
							>
								<SafeIcon icon="fa6-brands:github" size="1.125rem" />
								GitHub
							</a>
						)
					)}
				</div>
			</div>
		</div>
	);
}
