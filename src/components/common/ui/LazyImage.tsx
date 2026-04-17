import { memo, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import type { Effect } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface LazyImageProps {
	src: string;
	alt?: string;
	className?: string;
	/** 外层容器样式 */
	wrapperClassName?: string;
	placeholderSrc?: string;
	effect?: Effect;
	threshold?: number;
	onLoad?: () => void;
	onClick?: () => void;
	/** 显示加载中骨架屏 */
	showSkeleton?: boolean;
	/** 图片宽高比（用于预留空间，减少 CLS），如 '16/9' 或 '4/3' */
	aspectRatio?: string;
}

/**
 * 懒加载图片组件
 *
 * 特性：
 * - 滚动到可视区域时才加载图片
 * - 支持模糊占位图效果（blur）
 * - 加载完成后自动淡入
 * - 可选加载中骨架屏动画
 * - 支持 aspectRatio 预留空间，减少 CLS
 *
 * 使用示例：
 * <LazyImage src="..." alt="封面" effect="blur" wrapperClassName="w-full" aspectRatio="16/9" showSkeleton />
 */
export const LazyImage = memo(function LazyImage({
	src,
	alt = "",
	className = "",
	wrapperClassName = "",
	placeholderSrc,
	effect = "blur",
	threshold = 100,
	onLoad,
	onClick,
	showSkeleton = true,
	aspectRatio,
}: LazyImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);

	const handleLoad = () => {
		setIsLoaded(true);
		onLoad?.();
	};

	// 使用 aspect-ratio 预留空间，减少 CLS
	const containerStyle = aspectRatio ? { aspectRatio } : undefined;

	return (
		<div className={`relative ${wrapperClassName}`} style={containerStyle}>
			{/* 骨架屏占位 */}
			{showSkeleton && !isLoaded && (
				<div className="absolute inset-0 bg-[var(--card-bg)] animate-pulse flex items-center justify-center">
					<div className="w-8 h-8 rounded-full border-2 border-[var(--border-light)] border-t-[var(--primary)] animate-spin" />
				</div>
			)}
			{/* 图片 - 使用 !block 强制 wrapper span 为 block */}
			<LazyLoadImage
				src={src}
				alt={alt}
				className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
				wrapperClassName="!block w-full h-full"
				placeholderSrc={placeholderSrc}
				effect={effect}
				threshold={threshold}
				onLoad={handleLoad}
				onClick={onClick}
			/>
		</div>
	);
});
