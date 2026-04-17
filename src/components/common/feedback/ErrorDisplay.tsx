import { SafeIcon } from "@/components/common/ui";

interface StatusDisplayProps {
	message?: string;
	icon?: string;
	variant?: "error" | "empty" | "notfound";
	className?: string;
}

const variants = {
	error: {
		bg: "bg-red-500/10",
		iconColor: "text-red-500",
		defaultIcon: "material-symbols:error-outline-rounded",
		defaultMsg: "加载失败",
	},
	empty: {
		bg: "bg-[var(--btn-regular-bg)]",
		iconColor: "text-[var(--primary)]",
		defaultIcon: "material-symbols:article-outline-rounded",
		defaultMsg: "暂无内容",
	},
	notfound: {
		bg: "bg-[var(--btn-regular-bg)]",
		iconColor: "text-[var(--primary)]",
		defaultIcon: "material-symbols:search-rounded",
		defaultMsg: "未找到内容",
	},
};

/** 状态展示组件（错误/空/404） */
export function StatusDisplay({
	message,
	icon,
	variant = "error",
	className = "",
}: StatusDisplayProps) {
	const v = variants[variant];
	return (
		<div className={`card-base p-8 text-center fade-in-up ${className}`}>
			<div
				className={`w-16 h-16 rounded-full ${v.bg} mx-auto mb-4 flex items-center justify-center`}
			>
				<SafeIcon
					icon={icon || v.defaultIcon}
					size="1.875rem"
					className={v.iconColor}
				/>
			</div>
			<p className="text-75">{message || v.defaultMsg}</p>
		</div>
	);
}

// 兼容旧接口的导出
export const ErrorDisplay = (props: Omit<StatusDisplayProps, "variant">) => (
	<StatusDisplay {...props} variant="error" />
);
export const NotFoundDisplay = (props: Omit<StatusDisplayProps, "variant">) => (
	<StatusDisplay {...props} variant="notfound" />
);
export const EmptyState = (
	props: Omit<StatusDisplayProps, "variant"> & { icon?: string },
) => <StatusDisplay {...props} variant="empty" />;
