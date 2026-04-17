/**
 * 页面头部组件
 *
 * 用于管理页面和列表页的标题区域
 */

import { SafeIcon } from "@/components/common/ui";
import { Link } from "react-router-dom";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	icon: string;
	count?: number;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
}

export function PageHeader({
	title,
	subtitle,
	icon,
	count,
	action,
}: PageHeaderProps) {
	const ActionButton = action && (
		<LinkOrButton
			href={action.href}
			onClick={action.onClick}
			className="btn-regular rounded-[var(--radius-medium)] py-2 px-4 font-medium scale-animation ripple"
		>
			<SafeIcon
				icon="material-symbols:add-rounded"
				size="1rem"
				className="mr-1"
			/>
			{action.label}
		</LinkOrButton>
	);

	return (
		<div className="card-base p-6 fade-in-up">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<IconBadge icon={icon} />
					<TitleBlock title={title} subtitle={subtitle} count={count} />
				</div>
				{ActionButton}
			</div>
		</div>
	);
}

/** 图标徽章 */
function IconBadge({ icon }: { icon: string }) {
	return (
		<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center">
			<SafeIcon icon={icon} size="1.25rem" className="text-white" />
		</div>
	);
}

/** 标题块 */
function TitleBlock({
	title,
	subtitle,
	count,
}: {
	title: string;
	subtitle?: string;
	count?: number;
}) {
	const displaySubtitle =
		subtitle ?? (count !== undefined ? `共 ${count} 条` : undefined);

	return (
		<div>
			<h1 className="text-90 text-xl font-bold">{title}</h1>
			{displaySubtitle && <p className="text-50 text-sm">{displaySubtitle}</p>}
		</div>
	);
}

/** 链接或按钮（根据是否有 href 决定渲染类型） */
function LinkOrButton({
	href,
	onClick,
	className,
	children,
}: {
	href?: string;
	onClick?: () => void;
	className: string;
	children: React.ReactNode;
}) {
	if (href) {
		return (
			<Link to={href} className={className}>
				{children}
			</Link>
		);
	}
	return (
		<button onClick={onClick} className={className}>
			{children}
		</button>
	);
}
