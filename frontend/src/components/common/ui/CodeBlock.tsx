/**
 * 代码块组件
 *
 * 特性：
 * - 语法高亮 (动态加载语言包，优化首屏体积)
 * - 行号显示
 * - 一键复制
 * - 深色/浅色主题切换
 * - 代码折叠（超过 15 行自动折叠，底部可展开）
 *
 * 语言动态加载：js, ts, python, go, java, html, sql, json
 * 其他语言使用 text 模式（无高亮）
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	atomOneDark,
	atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useDarkMode } from "@/hooks";
import { SafeIcon } from "@/components/common/ui";

// 语言包映射表 - 动态导入路径
const LANGUAGE_MODULES: Record<string, () => Promise<{ default: unknown }>> = {
	javascript: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/javascript"),
	js: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/javascript"),
	typescript: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/typescript"),
	ts: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/typescript"),
	python: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/python"),
	py: () => import("react-syntax-highlighter/dist/esm/languages/hljs/python"),
	go: () => import("react-syntax-highlighter/dist/esm/languages/hljs/go"),
	java: () => import("react-syntax-highlighter/dist/esm/languages/hljs/java"),
	html: () =>
		import("react-syntax-highlighter/dist/esm/languages/hljs/htmlbars"),
	sql: () => import("react-syntax-highlighter/dist/esm/languages/hljs/sql"),
	json: () => import("react-syntax-highlighter/dist/esm/languages/hljs/json"),
};

// 已加载语言缓存
const loadedLanguages = new Set<string>();

/** 折叠阈值：超过此行数的代码块默认折叠 */
const COLLAPSE_THRESHOLD = 10;

interface CodeBlockProps {
	children: string;
	language?: string;
	className?: string;
}

/** 支持的语言列表（可动态加载） */
const SUPPORTED_LANGS = new Set(Object.keys(LANGUAGE_MODULES));

/** 语言显示名称 */
const LANGUAGE_NAMES: Record<string, string> = {
	js: "JavaScript",
	javascript: "JavaScript",
	ts: "TypeScript",
	typescript: "TypeScript",
	py: "Python",
	python: "Python",
	go: "Go",
	java: "Java",
	html: "HTML",
	sql: "SQL",
	json: "JSON",
	css: "CSS",
	sh: "Shell",
	bash: "Bash",
	yaml: "YAML",
	markdown: "Markdown",
	text: "Text",
};

/** 获取语言显示名称 */
function getLanguageName(lang: string): string {
	if (!lang) return "Code";
	const normalized = lang.toLowerCase().replace("language-", "");
	return LANGUAGE_NAMES[normalized] || normalized.toUpperCase();
}

/** 获取实际使用的语言（不支持的语言回退到 text） */
function getActualLang(lang: string): string {
	const normalized = lang.toLowerCase().replace("language-", "");
	return SUPPORTED_LANGS.has(normalized) ? normalized : "text";
}

/** Mac 窗口控制按钮 */
const WindowControls = memo(function WindowControls() {
	return (
		<div className="flex items-center gap-1">
			<div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
			<div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
			<div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
		</div>
	);
});

/** 语法高亮器样式 (静态常量) */
const CUSTOM_STYLE = {
	margin: 0,
	padding: "0.75rem",
	background: "transparent",
	fontSize: "0.85rem",
	lineHeight: "1.6",
} as const;

const CODE_TAG_STYLE = {
	background: "transparent",
} as const;

export const CodeBlock = memo(function CodeBlock({
	children,
	language,
	className,
}: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const [lineCount, setLineCount] = useState(0);
	const [languageLoaded, setLanguageLoaded] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const isDark = useDarkMode();
	const codeRef = useRef<string>(children);

	// 解析语言
	const langMatch = className?.match(/language-(\w+)/);
	const lang = langMatch?.[1] || language || "text";
	const langDisplay = getLanguageName(lang);
	const actualLang = getActualLang(lang);

	// 是否可折叠（超过阈值行数）
	const isCollapsible = lineCount > COLLAPSE_THRESHOLD;

	// 更新代码内容和行数
	useEffect(() => {
		codeRef.current = children;
		setLineCount(children.split("\n").length);
	}, [children]);

	// 动态加载语言包
	useEffect(() => {
		if (actualLang === "text" || loadedLanguages.has(actualLang)) {
			setLanguageLoaded(true);
			return;
		}

		const loader = LANGUAGE_MODULES[actualLang];
		if (!loader) {
			setLanguageLoaded(true);
			return;
		}

		loader()
			.then((module) => {
				SyntaxHighlighter.registerLanguage(actualLang, module.default);
				loadedLanguages.add(actualLang);
				setLanguageLoaded(true);
			})
			.catch(() => {
				// 加载失败，回退到 text
				setLanguageLoaded(true);
			});
	}, [actualLang]);

	// 复制处理
	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(codeRef.current);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	// 展开/折叠切换
	const toggleExpand = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	// 获取显示的代码（折叠时只显示前 COLLAPSE_THRESHOLD 行）
	const displayCode = useMemo(() => {
		if (expanded || !isCollapsible) {
			return children;
		}
		const lines = children.split("\n");
		return lines.slice(0, COLLAPSE_THRESHOLD).join("\n");
	}, [children, expanded, isCollapsible]);

	// 显示的行数
	const displayLineCount = useMemo(() => {
		if (expanded || !isCollapsible) {
			return lineCount;
		}
		return COLLAPSE_THRESHOLD;
	}, [lineCount, expanded, isCollapsible]);

	// 主题样式 (使用 useMemo 缓存)
	const theme = useMemo(
		() =>
			isDark
				? {
						bg: "var(--codeblock-bg, #282c34)",
						headerBg: "var(--codeblock-header-bg, #21252b)",
						lineNumBg: "var(--codeblock-line-bg, #21252b)",
						lineNumColor: "var(--codeblock-line-color, #5c6370)",
						border: "var(--codeblock-border, rgba(255, 255, 255, 0.08))",
						text: "var(--codeblock-btn-color, #abb2bf)",
						btnBg: "var(--codeblock-btn-bg, #3e4451)",
						btnHover: "var(--codeblock-btn-hover, #4e5666)",
					}
				: {
						bg: "var(--codeblock-bg, #fafafa)",
						headerBg: "var(--codeblock-header-bg, #f0f0f0)",
						lineNumBg: "var(--codeblock-line-bg, #f5f5f5)",
						lineNumColor: "var(--codeblock-line-color, #999)",
						border: "var(--codeblock-border, rgba(0, 0, 0, 0.06))",
						text: "var(--codeblock-btn-color, #383a42)",
						btnBg: "var(--codeblock-btn-bg, #e1e4e8)",
						btnHover: "var(--codeblock-btn-hover, #d1d5da)",
					},
		[isDark],
	);

	// 语言包加载中的 fallback - 显示无高亮的代码
	if (!languageLoaded && actualLang !== "text") {
		return (
			<div
				className="code-block group my-6 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
				style={{
					border: `1px solid ${theme.border}`,
					backgroundColor: theme.bg,
				}}
			>
				<div
					className="flex items-center justify-between px-3 py-1"
					style={{
						backgroundColor: theme.headerBg,
						borderBottom: `1px solid ${theme.border}`,
					}}
				>
					<WindowControls />
					<span
						className="text-[0.7rem] font-medium tracking-wider"
						style={{ color: "var(--codeblock-lang-color, #888)" }}
					>
						{langDisplay}
					</span>
				</div>
				<pre
					className="p-3 overflow-x-auto text-sm font-mono"
					style={{
						background: "transparent",
					}}
				>
					<code>{children}</code>
				</pre>
			</div>
		);
	}

	return (
		<div
			className="code-block group my-6 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
			style={{
				border: `1px solid ${theme.border}`,
				backgroundColor: theme.bg,
			}}
		>
			{/* 头部：Mac 按钮 + 语言标识 + 复制按钮 */}
			<div
				className="flex items-center justify-between px-3 py-1 relative"
				style={{
					backgroundColor: theme.headerBg,
					borderBottom: `1px solid ${theme.border}`,
				}}
			>
				<WindowControls />

				<span
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.7rem] font-medium tracking-wider font-mono"
					style={{
						color: "var(--codeblock-lang-color, #888)",
					}}
				>
					{langDisplay}
				</span>

				<button
					onClick={handleCopy}
					className="flex items-center justify-center w-6 h-6 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
					style={{ backgroundColor: theme.btnBg, color: theme.text }}
					aria-label="复制代码"
					title="复制代码"
					onMouseEnter={(e) =>
						(e.currentTarget.style.backgroundColor = theme.btnHover)
					}
					onMouseLeave={(e) =>
						(e.currentTarget.style.backgroundColor = theme.btnBg)
					}
				>
					{copied ? (
						<SafeIcon
							icon="lucide:check"
							size="0.875rem"
							className="text-green-500"
						/>
					) : (
						<SafeIcon icon="lucide:copy" size="0.875rem" />
					)}
				</button>
			</div>

			{/* 代码区域：行号 + 代码 */}
			<div className="flex relative">
				{/* 行号列 - 宽度根据行数自适应 */}
				<div
					className="flex-shrink-0 py-3 pr-2 pl-2 text-center select-none border-r"
					style={{
						backgroundColor: theme.lineNumBg,
						borderColor: theme.border,
						minWidth: `${String(lineCount).length + 2}ch`,
						color: theme.lineNumColor,
					}}
				>
					{Array.from({ length: displayLineCount }, (_, i) => (
						<div key={i} className="text-[0.85rem] leading-[1.6] font-mono">
							{i + 1}
						</div>
					))}
				</div>

				{/* 代码内容 */}
				<div className="flex-1 overflow-x-auto scrollbar-hide group-hover:scrollbar-default transition-all relative code-content-wrapper">
					<SyntaxHighlighter
						language={actualLang}
						style={isDark ? atomOneDark : atomOneLight}
						customStyle={CUSTOM_STYLE}
						codeTagProps={{ style: CODE_TAG_STYLE }}
						PreTag="div"
					>
						{displayCode}
					</SyntaxHighlighter>
					{/* 折叠时的渐变遮罩 */}
					{isCollapsible && !expanded && (
						<div
							className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
							style={{
								background: `linear-gradient(to bottom, transparent, ${theme.bg})`,
							}}
						/>
					)}
				</div>
			</div>

			{/* 展开/折叠按钮 */}
			{isCollapsible && (
				<button
					onClick={toggleExpand}
					className="w-full py-1.5 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 hover:bg-[var(--btn-regular-bg)]"
					style={{
						color: theme.lineNumColor,
						borderTop: `1px solid ${theme.border}`,
						backgroundColor: theme.headerBg,
					}}
				>
					{expanded ? (
						<>
							<SafeIcon icon="lucide:chevron-up" size="0.875rem" />
							<span>收起代码</span>
						</>
					) : (
						<>
							<SafeIcon icon="lucide:chevron-down" size="0.875rem" />
							<span>展开全部 ({lineCount} 行)</span>
						</>
					)}
				</button>
			)}
		</div>
	);
});
