/**
 * 稳定尺寸的图标组件
 *
 * 解决 @iconify/react 图标加载前布局抖动问题
 * 通过固定尺寸预留空间，避免重排
 */

import { Icon } from "@iconify/react";
import { memo, CSSProperties } from "react";

export interface SafeIconProps {
	/** 图标尺寸，默认 1em */
	size?: number | string;
	/** 图标名称 */
	icon: string;
	/** 自定义类名 */
	className?: string;
	/** 自定义样式 */
	style?: CSSProperties;
	/** 点击回调 */
	onClick?: () => void;
}

/**
 * SafeIcon - 防止布局抖动的图标组件
 *
 * @example
 * // 基本用法
 * <SafeIcon icon="material-symbols:home" />
 *
 * // 指定尺寸
 * <SafeIcon icon="material-symbols:home" size={24} />
 * <SafeIcon icon="material-symbols:home" size="1.5rem" />
 *
 * // 带 className
 * <SafeIcon icon="material-symbols:home" className="text-primary" size={20} />
 */
export const SafeIcon = memo(function SafeIcon({
	size = "1em",
	icon,
	className,
	style,
	onClick,
}: SafeIconProps) {
	// 计算 CSS 变量值
	const sizeValue = typeof size === "number" ? `${size}px` : size;

	return (
		<span
			className={className}
			onClick={onClick}
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: sizeValue,
				height: sizeValue,
				minWidth: sizeValue,
				minHeight: sizeValue,
				flexShrink: 0,
				...style,
			}}
		>
			<Icon icon={icon} width={sizeValue} height={sizeValue} />
		</span>
	);
});
