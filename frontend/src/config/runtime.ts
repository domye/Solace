/**
 * 运行时配置模块
 *
 * 支持两种配置来源：
 * 1. 运行时配置：window.__RUNTIME_CONFIG__（Docker 部署时注入）
 * 2. 构建时配置：import.meta.env（开发/构建时注入）
 *
 * 运行时配置优先级更高，便于 Docker 部署时动态配置
 */

// 运行时配置类型
interface RuntimeConfig {
	API_BASE: string;
	SITE_BASE_URL?: string; // 站点完整 URL，用于 SEO
	SITE_NAME?: string; // 站点名称
	SITE_DESCRIPTION?: string; // 站点描述
	IMGBED_BASE?: string;
	IMGBED_UPLOAD_TOKEN?: string;
	IMGBED_UPLOAD_CHANNEL?: string;
	IMGBED_UPLOAD_CHANNEL_NAME?: string;
	IMGBED_UPLOAD_FIELD?: string;
	IMGBED_UPLOAD_FOLDER?: string;
	IMGBED_CHUNK_THRESHOLD_MB?: string;
	IMGBED_CHUNK_SIZE_MB?: string;
}

// 扩展 Window 类型
declare global {
	interface Window {
		__RUNTIME_CONFIG__?: RuntimeConfig;
	}
}

type BuildTimeEnv = Record<string, string | undefined>;

function getBuildTimeEnv(): BuildTimeEnv {
	return import.meta.env ?? {};
}

function getRuntimeConfig(): RuntimeConfig | undefined {
	return typeof window !== "undefined" ? window.__RUNTIME_CONFIG__ : undefined;
}

/**
 * 获取 API Base URL
 * 优先使用运行时配置，否则使用构建时配置
 */
export function getApiBase(): string {
	const runtimeConfig = getRuntimeConfig();
	if (runtimeConfig?.API_BASE) {
		return runtimeConfig.API_BASE;
	}

	return getBuildTimeEnv().VITE_API_BASE || "/api/v1";
}

/**
 * 获取站点完整 URL（用于 SEO canonical、OG 等）
 */
export function getSiteBaseUrl(): string {
	const runtimeConfig = getRuntimeConfig();
	if (runtimeConfig?.SITE_BASE_URL) {
		return runtimeConfig.SITE_BASE_URL;
	}
	return getBuildTimeEnv().VITE_SITE_BASE_URL || "";
}

/**
 * 获取站点名称
 */
export function getSiteName(): string {
	const runtimeConfig = getRuntimeConfig();
	if (runtimeConfig?.SITE_NAME) {
		return runtimeConfig.SITE_NAME;
	}
	return getBuildTimeEnv().VITE_SITE_NAME || "Blog";
}

/**
 * 获取站点描述
 */
export function getSiteDescription(): string {
	const runtimeConfig = getRuntimeConfig();
	if (runtimeConfig?.SITE_DESCRIPTION) {
		return runtimeConfig.SITE_DESCRIPTION;
	}
	return getBuildTimeEnv().VITE_SITE_DESCRIPTION || "";
}

export function getImgBedBase(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_BASE || getBuildTimeEnv().VITE_IMGBED_BASE || "";
}

export function getImgBedUploadToken(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_UPLOAD_TOKEN || getBuildTimeEnv().VITE_IMGBED_UPLOAD_TOKEN || "";
}

export function getImgBedUploadChannel(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_UPLOAD_CHANNEL || getBuildTimeEnv().VITE_IMGBED_UPLOAD_CHANNEL || "cfr2";
}

export function getImgBedUploadChannelName(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_UPLOAD_CHANNEL_NAME || getBuildTimeEnv().VITE_IMGBED_UPLOAD_CHANNEL_NAME || "";
}

export function getImgBedUploadField(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_UPLOAD_FIELD || getBuildTimeEnv().VITE_IMGBED_UPLOAD_FIELD || "file";
}

export function getImgBedUploadFolder(): string {
	const runtimeConfig = getRuntimeConfig();
	return runtimeConfig?.IMGBED_UPLOAD_FOLDER || getBuildTimeEnv().VITE_IMGBED_UPLOAD_FOLDER || "Blog";
}

function parseMegabytes(rawValue: string | undefined, fallback: number): number {
	const parsed = Number(rawValue);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getImgBedChunkThresholdBytes(): number {
	const runtimeConfig = getRuntimeConfig();
	const value = runtimeConfig?.IMGBED_CHUNK_THRESHOLD_MB || getBuildTimeEnv().VITE_IMGBED_CHUNK_THRESHOLD_MB;
	return parseMegabytes(value, 20) * 1024 * 1024;
}

export function getImgBedChunkSizeBytes(): number {
	const runtimeConfig = getRuntimeConfig();
	const value = runtimeConfig?.IMGBED_CHUNK_SIZE_MB || getBuildTimeEnv().VITE_IMGBED_CHUNK_SIZE_MB;
	return parseMegabytes(value, 8) * 1024 * 1024;
}
