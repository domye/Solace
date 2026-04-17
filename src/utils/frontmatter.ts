/**
 * YAML Frontmatter 解析工具
 *
 * 解析 Markdown 文件中的 YAML frontmatter 部分
 * 格式：
 * ---
 * key: value
 * list:
 *   - item1
 *   - item2
 * ---
 *
 * Markdown 正文内容
 */

import * as yaml from "js-yaml";
import type { ParsedContent } from "@/types";

/**
 * 解析 Markdown 中的 YAML frontmatter
 */
export function parseFrontmatter<T extends object>(
	content: string,
): ParsedContent<T> {
	// 统一换行符为 LF
	const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	// 正则匹配 --- 开头和结尾的 YAML 块（允许结尾无换行）
	const frontmatterRegex = /^---\n([\s\S]*?)\n---(?:\n|$)/;
	const match = normalizedContent.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {} as T, markdown: normalizedContent };
	}

	const yamlContent = match[1] || "";
	const markdown = normalizedContent.slice(match[0]?.length || 0);

	// 使用 js-yaml 解析
	const frontmatter = yaml.load(yamlContent) as T;

	return { frontmatter, markdown };
}

/**
 * 将 frontmatter 对象转换为 YAML 字符串
 */
export function stringifyFrontmatter(
	frontmatter: Record<string, unknown>,
): string {
	if (Object.keys(frontmatter).length === 0) {
		return "";
	}

	const yamlContent = yaml.dump(frontmatter, {
		indent: 2,
		lineWidth: -1,
		quotingType: '"',
	});

	return `---\n${yamlContent}---\n`;
}
