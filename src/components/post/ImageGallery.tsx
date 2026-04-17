/**
 * 图片画廊组件
 *
 * 使用 react-photo-album 实现自适应 Rows 布局
 * 集成 yet-another-react-lightbox 实现点击预览
 *
 * 支持参数：
 * - targetRowHeight: 目标行高度（默认 200）
 * - columns: 每行最多图片数（通过 rowConstraints.maxPhotos 实现）
 */

import { memo, useState, useCallback, useEffect } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import "react-photo-album/rows.css";
import "yet-another-react-lightbox/styles.css";

/** 图片数据结构 */
export interface GalleryPhoto {
	src: string;
	alt?: string;
	width?: number;
	height?: number;
}

interface ImageGalleryProps {
	photos: GalleryPhoto[];
	targetRowHeight?: number;
	columns?: number; // 每行最多图片数
	className?: string;
}

/** 默认行高度 */
const DEFAULT_ROW_HEIGHT = 200;

/** 图片间距 */
const SPACING = 8;

/** 内部使用的图片类型 */
interface ProcessedPhoto {
	src: string;
	alt: string;
	width: number;
	height: number;
}

export const ImageGallery = memo(function ImageGallery({
	photos,
	targetRowHeight = DEFAULT_ROW_HEIGHT,
	columns,
	className = "",
}: ImageGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	// 存储已加载尺寸的图片
	const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);

	// 加载图片真实尺寸
	useEffect(() => {
		// 如果所有图片都已有尺寸，直接使用
		const allHaveDimensions = photos.every((p) => p.width && p.height);
		if (allHaveDimensions) {
			setProcessedPhotos(
				photos.map((photo) => ({
					src: photo.src,
					alt: photo.alt || "",
					width: photo.width!,
					height: photo.height!,
				})),
			);
			return;
		}

		// 否则加载图片尺寸
		let mounted = true;
		const loadDimensions = async () => {
			const results = await Promise.all(
				photos.map((photo) => {
					return new Promise<ProcessedPhoto>((resolve) => {
						if (photo.width && photo.height) {
							resolve({
								src: photo.src,
								alt: photo.alt || "",
								width: photo.width,
								height: photo.height,
							});
							return;
						}
						const img = new Image();
						img.onload = () => {
							resolve({
								src: photo.src,
								alt: photo.alt || "",
								width: img.naturalWidth,
								height: img.naturalHeight,
							});
						};
						img.onerror = () => {
							// 加载失败时使用默认尺寸
							resolve({
								src: photo.src,
								alt: photo.alt || "",
								width: 800,
								height: 600,
							});
						};
						img.src = photo.src;
					});
				}),
			);
			if (mounted) {
				setProcessedPhotos(results);
			}
		};
		loadDimensions();
		return () => {
			mounted = false;
		};
	}, [photos]);

	// 打开 lightbox
	const openLightbox = useCallback((index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	}, []);

	// 关闭 lightbox
	const closeLightbox = useCallback(() => {
		setLightboxOpen(false);
	}, []);

	// 如果没有图片，不渲染
	if (!photos.length) return null;

	// 等待图片尺寸加载
	if (!processedPhotos.length) {
		return (
			<div className={`my-4 ${className}`}>
				<div className="flex items-center justify-center py-8 text-50">
					加载图片中...
				</div>
			</div>
		);
	}

	// 转换为 lightbox 需要的格式
	const lightboxSlides = photos.map((photo) => ({
		src: photo.src,
		alt: photo.alt || "",
	}));

	return (
		<div className={className}>
			<RowsPhotoAlbum
				photos={processedPhotos}
				targetRowHeight={targetRowHeight}
				spacing={SPACING}
				rowConstraints={columns ? { maxPhotos: columns } : undefined}
				onClick={({ index }: { index: number }) => openLightbox(index)}
			/>

			<Lightbox
				open={lightboxOpen}
				close={closeLightbox}
				index={lightboxIndex}
				slides={lightboxSlides}
				carousel={{ finite: false }}
				styles={{
					container: { backgroundColor: "rgba(0, 0, 0, 0.85)" },
				}}
				render={{
					slide: ({ slide }) => (
						<img
							src={slide.src}
							alt={slide.alt}
							style={{
								maxWidth: "100%",
								maxHeight: "100%",
								objectFit: "contain",
							}}
						/>
					),
				}}
			/>
		</div>
	);
});
