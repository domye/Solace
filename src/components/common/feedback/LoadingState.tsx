import { SafeIcon } from "@/components/common/ui";

interface LoadingStateProps {
	message?: string;
	className?: string;
	/** 内联模式（小尺寸） */
	inline?: boolean;
}

/** 加载状态组件 */
export function LoadingState({
	message = "加载中...",
	className = "",
	inline,
}: LoadingStateProps) {
	if (inline) {
		return (
			<div className={`flex justify-center py-2 mb-2 ${className}`}>
				<div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}
	return (
		<div className={`card-base p-8 text-center ${className}`}>
			<div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
			<p className="text-75">{message}</p>
		</div>
	);
}

/** 内联加载指示器（兼容旧接口） */
export const InlineLoader = (
	props: Omit<LoadingStateProps, "message" | "inline">,
) => <LoadingState {...props} inline />;

/** 空状态展示 */
export function EmptyState({
	icon = "material-symbols:article-outline-rounded",
	message = "暂无内容",
	className = "",
}: {
	icon?: string;
	message?: string;
	className?: string;
}) {
	return (
		<div className={`card-base p-8 text-center onload-animation ${className}`}>
			<SafeIcon icon={icon} size="2.5rem" className="text-50 mb-4" />
			<p className="text-75">{message}</p>
		</div>
	);
}
