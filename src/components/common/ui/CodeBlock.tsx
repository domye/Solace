/**
 * 代码块组件
 *
 * 支持 syntax 高亮、行号、复制功能
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/hooks';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

/** 语言显示名称（紧凑格式：短名 -> 显示名） */
const LANGUAGE_NAMES: Record<string, string> = {
  // 主流语言
  js: 'JavaScript', ts: 'TypeScript', py: 'Python',
  go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin',
  c: 'C', cpp: 'C++', cs: 'C#',
  rb: 'Ruby', php: 'PHP', swift: 'Swift',
  // Web & 样式
  html: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'Sass',
  vue: 'Vue', svelte: 'Svelte', jsx: 'JSX', tsx: 'TSX',
  // 脚本 & 配置
  sh: 'Shell', bash: 'Bash', sql: 'SQL', lua: 'Lua',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', xml: 'XML', toml: 'TOML',
  // 其他
  md: 'Markdown', dockerfile: 'Dockerfile', graphql: 'GraphQL',
  diff: 'Diff', r: 'R', matlab: 'MATLAB', perl: 'Perl',
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
      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
    </div>
  );
});

export const CodeBlock = memo(function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const isDark = useDarkMode();

  const langMatch = className?.match(/language-(\w+)/);
  const lang = langMatch?.[1] || language || 'text';
  const langDisplay = getLanguageName(lang);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [children]);

  const lines = children.split('\n');
  const lineCount = lines.length;

  const theme = useMemo(() => isDark ? {
    bg: 'var(--codeblock-bg, #282c34)',
    headerBg: 'var(--codeblock-header-bg, #21252b)',
    lineNumBg: 'var(--codeblock-line-bg, #21252b)',
    lineNumColor: 'var(--codeblock-line-color, #5c6370)',
    border: 'var(--codeblock-border, rgba(255, 255, 255, 0.08))',
    text: 'var(--codeblock-btn-color, #abb2bf)',
    btnBg: 'var(--codeblock-btn-bg, #3e4451)',
    btnHover: 'var(--codeblock-btn-hover, #4e5666)',
  } : {
    bg: 'var(--codeblock-bg, #fafafa)',
    headerBg: 'var(--codeblock-header-bg, #f0f0f0)',
    lineNumBg: 'var(--codeblock-line-bg, #f5f5f5)',
    lineNumColor: 'var(--codeblock-line-color, #999)',
    border: 'var(--codeblock-border, rgba(0, 0, 0, 0.06))',
    text: 'var(--codeblock-btn-color, #383a42)',
    btnBg: 'var(--codeblock-btn-bg, #e1e4e8)',
    btnHover: 'var(--codeblock-btn-hover, #d1d5da)',
  }, [isDark]);

  return (
    <div className="code-block group my-6 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      {/* 头部：Mac 按钮 + 语言标识 + 复制按钮 */}
      <div
        className="flex items-center justify-between px-3 py-1 relative"
        style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
      >
        <WindowControls />

        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.7rem] font-medium tracking-wider"
          style={{ color: 'var(--codeblock-lang-color, #888)', fontFamily: "'JetBrains Mono Variable', monospace" }}
        >
          {langDisplay}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center justify-center w-6 h-6 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: theme.btnBg, color: theme.text }}
          aria-label="复制代码"
          title="复制代码"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.btnHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.btnBg)}
        >
          {copied ? (
            <Icon icon="lucide:check" className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 代码区域：行号 + 代码 */}
      <div className="flex relative">
        {/* 行号列 */}
        <div
          className="flex-shrink-0 py-[0.75rem] pr-2 pl-2.5 text-right select-none border-r"
          style={{
            backgroundColor: theme.lineNumBg,
            borderColor: theme.border,
            minWidth: '2.5rem',
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-[0.85rem] leading-[1.6]"
              style={{ color: theme.lineNumColor, fontFamily: "'JetBrains Mono Variable', monospace" }}
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
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              background: 'transparent',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              fontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
            codeTagProps={{
              style: {
                fontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: 'transparent',
              },
            }}
            PreTag="div"
          >
            {children}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
});