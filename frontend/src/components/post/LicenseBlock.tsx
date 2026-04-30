/**
 * 文章版权声明组件
 *
 * 参考 Mizuki 主题的 License.astro 组件
 * 在文章底部显示版权信息
 */

import { memo } from "react";
import { SafeIcon } from "@/components/common/ui/SafeIcon";
import { formatDate } from "@/utils";
import { useOwner } from "@/hooks";

export interface LicenseBlockProps {
	/** 文章标题 */
	title: string;
	/** 文章链接 */
	url: string;
	/** 作者名称（可选，默认使用站长昵称） */
	author?: string;
	/** 发布日期 */
	publishedAt?: string;
	/** 许可证名称 */
	licenseName?: string;
	/** 许可证链接 */
	licenseUrl?: string;
}

/**
 * LicenseBlock - 文章版权声明
 *
 * 显示文章的版权信息，包括标题、作者、发布日期和许可证
 * 作者名称默认从站长信息获取
 *
 * @example
 * <LicenseBlock
 *   title="我的文章"
 *   url="https://example.com/posts/my-article"
 *   publishedAt="2024-01-15"
 * />
 */
export const LicenseBlock = memo(function LicenseBlock({
	title,
	url,
	author,
	publishedAt,
	licenseName = "CC BY-NC-SA 4.0",
	licenseUrl = "https://creativecommons.org/licenses/by-nc-sa/4.0/",
}: LicenseBlockProps) {
	const { data: owner } = useOwner();

	// 优先使用传入的 author，否则使用站长昵称
	const displayAuthor = author || owner?.nickname || "博主";
	return (
		<div className="relative overflow-hidden bg-[var(--btn-regular-bg)] py-2 px-3 md:py-3 md:px-4 lg:py-5 lg:px-6 rounded-xl mt-6 md:mt-8">
			{/* 文章标题 */}
			<div className="font-bold text-xs md:text-sm text-75 mb-0.5 md:mb-1">{title}</div>

			{/* 文章链接 */}
			<a
				href={url}
				className="text-[var(--primary)] hover:underline text-[10px] md:text-xs break-all"
				target="_blank"
				rel="noopener noreferrer"
			>
				{url}
			</a>

			{/* 信息行：作者、发布时间、许可证 */}
			<div className="flex gap-3 md:gap-4 lg:gap-6 mt-1.5 md:mt-2 lg:mt-3 flex-wrap">
				{/* 作者 */}
				<div>
					<div className="text-30 text-[10px] md:text-xs mb-0.5">作者</div>
					<div className="text-75 text-[10px] md:text-xs">{displayAuthor}</div>
				</div>

				{/* 发布时间 */}
				{publishedAt && (
					<div>
						<div className="text-30 text-[10px] md:text-xs mb-0.5">发布于</div>
						<div className="text-75 text-[10px] md:text-xs">{formatDate(publishedAt)}</div>
					</div>
				)}

				{/* 许可证 */}
				<div>
					<div className="text-30 text-[10px] md:text-xs mb-0.5">许可协议</div>
					<a
						href={licenseUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[var(--primary)] hover:underline text-[10px] md:text-xs"
					>
						{licenseName}
					</a>
				</div>
			</div>

			{/* 装饰性 Creative Commons 图标 */}
			<SafeIcon
				icon="fa6-brands:creative-commons"
				size="12rem"
				className="absolute pointer-events-none right-6 top-1/2 -translate-y-1/2 text-black/5 dark:text-white/5 hidden md:block"
			/>
		</div>
	);
});
