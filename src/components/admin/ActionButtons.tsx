import { Link } from "react-router-dom";
import { SafeIcon } from "@/components/common/ui";

interface ActionButtonProps {
	icon: string;
	title: string;
	href?: string;
	onClick?: () => void;
	disabled?: boolean;
	danger?: boolean;
}

/**
 * 操作按钮组件 - 用于管理列表项
 */
export function ActionButton({
	icon,
	title,
	href,
	onClick,
	disabled,
	danger,
}: ActionButtonProps) {
	const className = `btn-plain rounded-[var(--radius-medium)] h-9 w-9 scale-animation ripple flex items-center justify-center ${
		danger ? "text-red-500 hover:bg-red-500/10" : ""
	} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

	if (href) {
		return (
			<Link to={href} className={className} title={title}>
				<SafeIcon icon={icon} size="1.125rem" />
			</Link>
		);
	}

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={className}
			title={title}
		>
			<SafeIcon icon={icon} size="1.125rem" />
		</button>
	);
}

/**
 * 操作按钮组 - 编辑/删除组合
 */
export function EditDeleteButtons({
	editHref,
	editOnClick,
	onDelete,
	deleteDisabled,
}: {
	editHref?: string;
	editOnClick?: () => void;
	onDelete?: () => void;
	deleteDisabled?: boolean;
}) {
	return (
		<div className="flex items-center gap-1 shrink-0">
			<ActionButton
				icon="material-symbols:edit-outline-rounded"
				title="编辑"
				href={editHref}
				onClick={editOnClick}
			/>
			<ActionButton
				icon="material-symbols:delete-outline-rounded"
				title="删除"
				onClick={onDelete}
				disabled={deleteDisabled}
				danger
			/>
		</div>
	);
}
