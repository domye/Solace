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
