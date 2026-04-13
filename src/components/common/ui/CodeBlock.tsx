/**
 * 代码块组件
 *
 * 特性：
 * - 语法高亮
 * - 行号显示
 * - 一键复制
 * - 深色/浅色主题切换
 */

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDarkMode } from '@/hooks';
import { SafeIcon } from '@/components/common/ui';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

/** 语言显示名称 */
const LANGUAGE_NAMES: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  c: 'C',
  cpp: 'C++',
  cs: 'C#',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  vue: 'Vue',
  svelte: 'Svelte',
  jsx: 'JSX',
  tsx: 'TSX',
  sh: 'Shell',
  bash: 'Bash',
  sql: 'SQL',
  lua: 'Lua',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  toml: 'TOML',
  md: 'Markdown',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
  diff: 'Diff',
  r: 'R',
  matlab: 'MATLAB',
  perl: 'Perl',
};

function getLanguageName(lang: string): string {
  if (!lang) return 'Code';
  const normalized = lang.toLowerCase().replace('language-', '');
  return LANGUAGE_NAMES[normalized] || normalized.toUpperCase();
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
  padding: '0.75rem',
  background: 'transparent',
  fontSize: '0.85rem',
  lineHeight: '1.6',
  fontFamily:
    "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

const CODE_TAG_STYLE = {
  fontFamily:
    "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  background: 'transparent',
} as const;

export const CodeBlock = memo(function CodeBlock({
  children,
  language,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const isDark = useDarkMode();
  const codeRef = useRef<string>(children);

  // 解析语言
  const langMatch = className?.match(/language-(\w+)/);
  const lang = langMatch?.[1] || language || 'text';
  const langDisplay = getLanguageName(lang);

  // 更新代码内容和行数
  useEffect(() => {
    codeRef.current = children;
    setLineCount(children.split('\n').length);
  }, [children]);

  // 复制处理
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // 主题样式 (使用 useMemo 缓存)
  const theme = useMemo(
    () =>
      isDark
        ? {
            bg: 'var(--codeblock-bg, #282c34)',
            headerBg: 'var(--codeblock-header-bg, #21252b)',
            lineNumBg: 'var(--codeblock-line-bg, #21252b)',
            lineNumColor: 'var(--codeblock-line-color, #5c6370)',
            border: 'var(--codeblock-border, rgba(255, 255, 255, 0.08))',
            text: 'var(--codeblock-btn-color, #abb2bf)',
            btnBg: 'var(--codeblock-btn-bg, #3e4451)',
            btnHover: 'var(--codeblock-btn-hover, #4e5666)',
          }
        : {
            bg: 'var(--codeblock-bg, #fafafa)',
            headerBg: 'var(--codeblock-header-bg, #f0f0f0)',
            lineNumBg: 'var(--codeblock-line-bg, #f5f5f5)',
            lineNumColor: 'var(--codeblock-line-color, #999)',
            border: 'var(--codeblock-border, rgba(0, 0, 0, 0.06))',
            text: 'var(--codeblock-btn-color, #383a42)',
            btnBg: 'var(--codeblock-btn-bg, #e1e4e8)',
            btnHover: 'var(--codeblock-btn-hover, #d1d5da)',
          },
    [isDark]
  );

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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.7rem] font-medium tracking-wider"
          style={{
            color: 'var(--codeblock-lang-color, #888)',
            fontFamily: "'JetBrains Mono Variable', monospace",
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
            <SafeIcon icon="lucide:check" size="0.875rem" className="text-green-500" />
          ) : (
            <SafeIcon icon="lucide:copy" size="0.875rem" />
          )}
        </button>
      </div>

      {/* 代码区域：行号 + 代码 */}
      <div className="flex relative">
        {/* 行号列 */}
        <div
          className="flex-shrink-0 py-3 pr-2 pl-2.5 text-right select-none border-r"
          style={{
            backgroundColor: theme.lineNumBg,
            borderColor: theme.border,
            minWidth: '2.5rem',
            color: theme.lineNumColor,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-[0.85rem] leading-[1.6]"
              style={{
                fontFamily: "'JetBrains Mono Variable', monospace",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* 代码内容 */}
        <div className="flex-1 overflow-x-auto scrollbar-hide group-hover:scrollbar-default transition-all relative code-content-wrapper">
          <SyntaxHighlighter
            language={lang}
            style={isDark ? oneDark : oneLight}
            customStyle={CUSTOM_STYLE}
            codeTagProps={{ style: CODE_TAG_STYLE }}
            PreTag="div"
          >
            {children}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
});
