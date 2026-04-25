/** 图片URL处理工具 */

const RANDOM_IMAGE_DOMAINS = [
	"picapi.pai.al",
	"picsum.photos",
	"source.unsplash.com",
	"loremflickr.com",
	"placeimg.com",
];

function isRandomImageUrl(url: string): boolean {
	try {
		return RANDOM_IMAGE_DOMAINS.some((d) => new URL(url).hostname.includes(d));
	} catch {
		return false;
	}
}

export function bustImageCache(
	url: string | undefined,
	seed?: number,
): string | undefined {
	if (!url || !isRandomImageUrl(url)) return url;
	return `${url}${url.includes("?") ? "&" : "?"}_r=${seed ?? Math.floor(Math.random() * 1000000)}`;
}

export const processArticleCoverImage = bustImageCache;

const IMAGE_WIDTH_PARAM = "md_width";

export interface ImageRenderMetadata {
	src: string;
	width?: number;
	style?: string;
}

function splitImageSrc(src: string) {
	const hashStart = src.indexOf("#");
	const beforeHash = hashStart >= 0 ? src.slice(0, hashStart) : src;
	const hash = hashStart >= 0 ? src.slice(hashStart) : "";
	const queryStart = beforeHash.indexOf("?");

	return {
		path: queryStart >= 0 ? beforeHash.slice(0, queryStart) : beforeHash,
		query: queryStart >= 0 ? beforeHash.slice(queryStart + 1) : "",
		hash,
	};
}

function buildImageSrc(path: string, params: URLSearchParams, hash: string): string {
	const query = params.toString();
	return `${path}${query ? `?${query}` : ""}${hash}`;
}

export function appendImageWidthParam(src: string, width: number): string {
	if (!Number.isInteger(width) || width <= 0) {
		return src;
	}

	const { path, query, hash } = splitImageSrc(src);
	const params = new URLSearchParams(query);
	params.set(IMAGE_WIDTH_PARAM, String(width));
	return buildImageSrc(path, params, hash);
}

export function getImageRenderMetadata(
	src: string | undefined,
	maxWidth: number,
): ImageRenderMetadata {
	if (!src) {
		return { src: "" };
	}

	const { path, query, hash } = splitImageSrc(src);
	const params = new URLSearchParams(query);
	const widthParam = params.get(IMAGE_WIDTH_PARAM);
	if (!widthParam) {
		return { src };
	}

	params.delete(IMAGE_WIDTH_PARAM);
	const renderSrc = buildImageSrc(path, params, hash);
	const requestedWidth = Number(widthParam);
	const width =
		Number.isInteger(requestedWidth) && requestedWidth > 0
			? Math.min(requestedWidth, maxWidth)
			: undefined;

	if (!width) {
		return { src: renderSrc };
	}

	return {
		src: renderSrc,
		width,
		style: `width:${width}px;max-width:100%;height:auto`,
	};
}
