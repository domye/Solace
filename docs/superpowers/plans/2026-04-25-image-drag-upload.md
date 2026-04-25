# 图片拖拽上传 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为管理端文章编辑页新增本地图片拖拽上传能力，覆盖 Markdown 编辑区（多图）和封面图片输入区（单图）。

**Architecture:** 新增通用 `useImageDropUpload` hook 统一处理拖拽态、文件过滤、上传调用和错误状态。Markdown 编辑器和封面区分别接入该 hook，各自定义"上传成功后怎么落地"。Markdown 编辑器复用现有粘贴上传的 Markdown 格式化链路，封面区直接写入 URL。不修改后端，不引入新库。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, `uploadImage()` from `@/api`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/src/hooks/useImageDropUpload.ts` | Create | 通用拖拽上传 hook：拖拽态、文件过滤、上传、错误状态 |
| `frontend/src/hooks/index.ts` | Modify | 导出新 hook |
| `frontend/src/components/admin/MarkdownEditor.tsx` | Modify | 接入 hook，复用粘贴链路插入 Markdown |
| `frontend/src/pages/admin/ArticleEditorPage.tsx` | Modify | 封面输入区外包 drop 容器，接入 hook |

---

### Task 1: 实现 `useImageDropUpload` hook

**Files:**
- Create: `frontend/src/hooks/useImageDropUpload.ts`
- Modify: `frontend/src/hooks/index.ts`

- [ ] **Step 1: 创建 hook 文件**

```typescript
// frontend/src/hooks/useImageDropUpload.ts
import { useState, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import { uploadImage } from "@/api";

interface UseImageDropUploadOptions {
  multiple?: boolean;
  maxFiles?: number;
  onUploadSuccess: (files: File[], urls: string[]) => Promise<void> | void;
  onUploadError?: (error: Error) => void;
}

interface UseImageDropUploadReturn {
  isDragActive: boolean;
  isUploading: boolean;
  uploadingCount: number;
  error: string;
  dragHandlers: {
    onDragEnter: (e: DragEvent<HTMLElement>) => void;
    onDragOver: (e: DragEvent<HTMLElement>) => void;
    onDragLeave: (e: DragEvent<HTMLElement>) => void;
    onDrop: (e: DragEvent<HTMLElement>) => void;
  };
  clearError: () => void;
}

function filterImageFiles(files: File[], maxFiles: number): File[] {
  const images = files.filter((f) => f.type.startsWith("image/"));
  return images.slice(0, maxFiles);
}

export function useImageDropUpload({
  multiple = false,
  maxFiles,
  onUploadSuccess,
  onUploadError,
}: UseImageDropUploadOptions): UseImageDropUploadReturn {
  const effectiveMax = multiple ? (maxFiles ?? Infinity) : 1;

  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");

  const dragDepthRef = useRef(0);

  const clearError = useCallback(() => setError(""), []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (dragDepthRef.current === 1) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragActive(false);

      const allFiles = Array.from(e.dataTransfer.files);
      const accepted = filterImageFiles(allFiles, effectiveMax);

      if (accepted.length === 0) {
        return;
      }

      setError("");
      setUploadingCount((c) => c + accepted.length);

      Promise.all(accepted.map((f) => uploadImage(f)))
        .then(async (urls) => {
          await onUploadSuccess(accepted, urls);
        })
        .catch((err: unknown) => {
          const error =
            err instanceof Error ? err : new Error("Image upload failed");
          setError(error.message);
          onUploadError?.(error);
        })
        .finally(() => {
          setUploadingCount((c) => Math.max(0, c - accepted.length));
        });
    },
    [effectiveMax, onUploadSuccess, onUploadError],
  );

  return {
    isDragActive,
    isUploading: uploadingCount > 0,
    uploadingCount,
    error,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    clearError,
  };
}
```

- [ ] **Step 2: 在 hooks/index.ts 中导出新 hook**

在 `frontend/src/hooks/index.ts` 末尾添加一行：

```typescript
export * from "./useImageDropUpload";
```

文件变为：

```typescript
/**
 * Hooks 导出
 */

// API 相关 hooks（模块化）
export * from "./api";

// UI 相关 hooks
export * from "./useDarkMode";
export * from "./useTocScroll";
export * from "./useActiveIndicator";
export * from "./useClickOutside";
export * from "./useEscapeKey";
export * from "./useAutoHideScrollbar";
export * from "./useMediaQuery";
export * from "./useImageDropUpload";
```

- [ ] **Step 3: 运行 typecheck 验证**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS（无新增错误）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useImageDropUpload.ts frontend/src/hooks/index.ts
git commit -m "feat: add useImageDropUpload hook for drag-and-drop image upload"
```

---

### Task 2: Markdown 编辑器接入拖拽上传

**Files:**
- Modify: `frontend/src/components/admin/MarkdownEditor.tsx`

关键设计决策：当前 `uploadImageAsMarkdown` 把上传和 Markdown 格式化耦合在一起。hook 已经负责上传，所以编辑器的 `onUploadSuccess` 回调里应该用已上传的 URL 直接格式化为 Markdown，而不是重新上传。需要拆出一个 `formatImageAsMarkdown` 纯函数。

- [ ] **Step 1: 在 MarkdownEditor.tsx 中添加拖拽上传**

将 `frontend/src/components/admin/MarkdownEditor.tsx` 修改为以下内容。核心变更：

1. 新增 `formatImageAsMarkdown` 纯函数（从 `uploadImageAsMarkdown` 中拆出格式化逻辑）
2. 重构 `uploadImageAsMarkdown` 使用新格式化函数
3. 新增 `processUploadedFiles` 复用格式化 + 插入逻辑（供粘贴和拖拽共用）
4. 接入 `useImageDropUpload` hook
5. 拖拽态 UI 叠加到现有 wrapper div

```typescript
// frontend/src/components/admin/MarkdownEditor.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
import { uploadImage } from "@/api";
import { useImageSettings, useImageDropUpload } from "@/hooks";
import { appendImageWidthParam, getImageRenderMetadata } from "@/utils/image";
import "react-markdown-editor-lite/lib/index.css";

const DEFAULT_IMAGE_WIDTH = 720;
const DEFAULT_IMAGE_MAX_WIDTH = 1000;

function createMarkdownParser(maxWidth: number): MarkdownIt {
	const parser = new MarkdownIt({
		html: false,
		linkify: true,
		typographer: true,
		breaks: true,
	});
	const defaultImageRenderer = parser.renderer.rules.image;

	parser.renderer.rules.image = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		if (!token) {
			return "";
		}

		const srcIndex = token.attrIndex("src");
		if (srcIndex >= 0) {
			const src = token.attrs?.[srcIndex]?.[1];
			const metadata = getImageRenderMetadata(src, maxWidth);
			token.attrs![srcIndex] = ["src", metadata.src];
			if (metadata.style) {
				token.attrSet("style", metadata.style);
			}
		}

		return defaultImageRenderer
			? defaultImageRenderer(tokens, idx, options, env, self)
			: self.renderToken(tokens, idx, options);
	};

	return parser;
}

function escapeMarkdownText(text: string): string {
	return text.replace(/[\\[\]]/g, "\\$&");
}

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	height?: number | string;
}

export function MarkdownEditor({
	value,
	onChange,
	placeholder = "在这里编写 Markdown 内容...",
	height = 500,
}: MarkdownEditorProps) {
	const { data: imageSettings } = useImageSettings();
	const editorStyle = useMemo(() => ({ height }), [height]);
	const mdParser = useMemo(
		() =>
			createMarkdownParser(
				imageSettings?.maxWidth ?? DEFAULT_IMAGE_MAX_WIDTH,
			),
		[imageSettings?.maxWidth],
	);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const valueRef = useRef(value);

	const [editorKey, setEditorKey] = useState(0);
	const [isInitialized, setIsInitialized] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [uploadingCount, setUploadingCount] = useState(0);

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	useEffect(() => {
		if (value && !isInitialized) {
			setIsInitialized(true);
			setEditorKey((k) => k + 1);
		}
	}, [value, isInitialized]);

	const handleEditorChange = ({ text }: { html: string; text: string }) => {
		onChange(text);
	};

	const formatImageAsMarkdown = (file: File, uploadedUrl: string): string => {
		const alt = escapeMarkdownText(
			file.name?.replace(/\.[^.]+$/, "") || "pasted-image",
		);
		const url =
			imageSettings?.appendWidthToPastedImages ?? true
				? appendImageWidthParam(
						uploadedUrl,
						imageSettings?.defaultWidth ?? DEFAULT_IMAGE_WIDTH,
					)
				: uploadedUrl;
		return `![${alt}](${url})`;
	};

	const uploadImageAsMarkdown = async (file: File) => {
		const uploadedUrl = await uploadImage(file);
		return formatImageAsMarkdown(file, uploadedUrl);
	};

	const insertMarkdown = (markdown: string) => {
		const activeElement = document.activeElement;
		const editorTextarea =
			activeElement instanceof HTMLTextAreaElement &&
			wrapperRef.current?.contains(activeElement)
				? activeElement
				: wrapperRef.current?.querySelector("textarea");
		const currentValue = valueRef.current;

		if (!editorTextarea) {
			onChange(`${currentValue}${currentValue ? "\n\n" : ""}${markdown}`);
			return;
		}

		const start = editorTextarea.selectionStart ?? currentValue.length;
		const end = editorTextarea.selectionEnd ?? currentValue.length;
		const before = currentValue.slice(0, start);
		const after = currentValue.slice(end);
		const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
		const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
		const nextValue = `${before}${prefix}${markdown}${suffix}${after}`;

		onChange(nextValue);
		window.setTimeout(() => {
			const cursor = before.length + prefix.length + markdown.length;
			editorTextarea.focus();
			editorTextarea.setSelectionRange(cursor, cursor);
		}, 0);
	};

	const processUploadedFiles = (files: File[], urls: string[]) => {
		const markdownImages = files.map((f, i) =>
			formatImageAsMarkdown(f, urls[i]),
		);
		insertMarkdown(markdownImages.join("\n\n"));
	};

	const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
		const files = Array.from(event.clipboardData.files).filter((file) =>
			file.type.startsWith("image/"),
		);

		if (files.length === 0) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		setUploadError("");
		setUploadingCount((count) => count + files.length);
		try {
			const markdownImages = await Promise.all(
				files.map(uploadImageAsMarkdown),
			);
			insertMarkdown(markdownImages.join("\n\n"));
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : "Image upload failed",
			);
		} finally {
			setUploadingCount((count) => Math.max(0, count - files.length));
		}
	};

	const {
		isDragActive,
		error: dropError,
		dragHandlers,
		clearError: clearDropError,
	} = useImageDropUpload({
		multiple: true,
		onUploadSuccess: (files, urls) => {
			processUploadedFiles(files, urls);
		},
	});

	const displayError = dropError || uploadError;

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		setUploadError("");
		clearDropError();
		dragHandlers.onDragEnter(e);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		dragHandlers.onDragLeave(e);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		dragHandlers.onDragOver(e);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		dragHandlers.onDrop(e);
	};

	return (
		<div
			ref={wrapperRef}
			aria-busy={uploadingCount > 0}
			className="markdown-editor-wrapper relative h-full"
			onPasteCapture={handlePaste}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{displayError && (
				<div
					role="alert"
					className="mb-2 rounded-[var(--radius-medium)] bg-red-500/10 p-2 text-sm text-red-500"
				>
					{displayError}
				</div>
			)}
			{uploadingCount > 0 && (
				<div
					role="status"
					aria-live="polite"
					aria-atomic="true"
					className="pointer-events-none absolute right-4 top-12 z-20 flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-lg backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95 dark:text-slate-200"
				>
					<div
						aria-hidden="true"
						className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400"
					/>
					<span>
						{uploadingCount > 1
							? `${uploadingCount} 张图片上传中`
							: "图片上传中"}
					</span>
				</div>
			)}
			{isDragActive && (
				<div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-[var(--radius-medium)] border-2 border-dashed border-sky-400 bg-sky-50/80 dark:bg-sky-900/30">
					<span className="text-sm font-medium text-sky-600 dark:text-sky-300">
						松手上传
					</span>
				</div>
			)}
			<MdEditor
				key={editorKey}
				value={value}
				style={editorStyle}
				renderHTML={(text) => mdParser.render(text)}
				onChange={handleEditorChange}
				placeholder={placeholder}
				view={{ menu: true, md: true, html: false }}
				canView={{
					fullScreen: true,
					md: true,
					html: true,
					both: true,
					menu: true,
					hideMenu: true,
				}}
			/>
		</div>
	);
}
```

- [ ] **Step 2: 运行 typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 运行 lint**

Run: `cd frontend && npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/MarkdownEditor.tsx
git commit -m "feat(editor): add drag-and-drop image upload to markdown editor"
```

---

### Task 3: 封面图片输入区接入拖拽上传

**Files:**
- Modify: `frontend/src/pages/admin/ArticleEditorPage.tsx`

- [ ] **Step 1: 在 ArticleEditorPage.tsx 中添加封面拖拽上传**

核心变更：
1. 导入 `useImageDropUpload`
2. 在封面 `InputField` 外包一层 drop 容器
3. 上传成功后把第一张 URL 写入 `coverImage`

将 import 部分改为：

```typescript
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	useArticle,
	useCreateArticle,
	useUpdateArticle,
	useCategories,
	useTags,
	useImageDropUpload,
} from "@/hooks";
import { LoadingButton, InputField, TextAreaField } from "@/components";
import { LazyMarkdownEditor } from "@/components/admin";
import { request_CreateArticleRequest } from "@/api";
```

在组件内部 `const [error, setError] = useState("");` 之后添加：

```typescript
	const {
		isDragActive: isCoverDragActive,
		isUploading: isCoverUploading,
		error: coverUploadError,
		dragHandlers: coverDragHandlers,
	} = useImageDropUpload({
		multiple: false,
		onUploadSuccess: (_files, urls) => {
			if (urls[0]) {
				setCoverImage(urls[0]);
			}
		},
	});
```

将封面 `InputField` 区域（约 line 169）替换为：

```tsx
						<div
							className="relative"
							onDragEnter={coverDragHandlers.onDragEnter}
							onDragOver={coverDragHandlers.onDragOver}
							onDragLeave={coverDragHandlers.onDragLeave}
							onDrop={coverDragHandlers.onDrop}
						>
							<InputField
								label="封面图片"
								value={coverImage}
								onChange={setCoverImage}
								placeholder="https://example.com/cover.jpg"
								type="url"
							/>
							{isCoverDragActive && (
								<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-medium)] border-2 border-dashed border-sky-400 bg-sky-50/80 dark:bg-sky-900/30">
									<span className="text-sm font-medium text-sky-600 dark:text-sky-300">
										松手上传
									</span>
								</div>
							)}
							{isCoverUploading && (
								<div className="pointer-events-none absolute right-3 top-9 z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
									<div
										aria-hidden="true"
										className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400"
									/>
									<span>封面上传中</span>
								</div>
							)}
							{coverUploadError && (
								<p className="mt-1 text-xs text-red-500">{coverUploadError}</p>
							)}
						</div>
```

- [ ] **Step 2: 运行 typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 运行 lint**

Run: `cd frontend && npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/ArticleEditorPage.tsx
git commit -m "feat(editor): add drag-and-drop image upload to cover image field"
```

---

### Task 4: 构建验证

- [ ] **Step 1: 运行生产构建**

Run: `cd frontend && npm run build`
Expected: PASS（无编译错误）

- [ ] **Step 2: 运行完整 lint**

Run: `cd frontend && npm run lint`
Expected: PASS

---

### Task 5: 浏览器手动验证

- [ ] **Step 1: 启动本地开发环境**

Run: `cd frontend && npm run dev`

打开管理端文章编辑页（对应本地端口）

- [ ] **Step 2: 验证 Markdown 编辑区拖拽上传**

测试项：
1. 拖一张本地图片进入编辑区 → 出现高亮提示"松手上传" → 松手后上传 → Markdown 图片链接插入到光标位置
2. 拖多张本地图片进入编辑区 → 全部上传 → 多段 Markdown 以空行分隔插入
3. 拖一个 `.txt` 文件进入编辑区 → 不触发上传，无异常

- [ ] **Step 3: 验证封面区拖拽上传**

测试项：
1. 拖一张本地图片到封面输入区域 → 高亮提示 → 上传后 URL 自动填入输入框
2. 拖多张图片到封面区域 → 只上传第一张，URL 填入
3. 手动编辑封面 URL → 仍然可以正常修改
4. 上传失败时 → 显示错误提示，不清空已有 URL

- [ ] **Step 4: 验证现有粘贴上传未受影响**

测试项：
1. 在编辑区 Ctrl+V 粘贴一张截图 → 仍正常上传并插入 Markdown
2. 上传中浮层仍正常显示
3. 上传失败时错误提示仍正常显示

---

## Self-Review

**1. Spec coverage:**
- Markdown 编辑区拖拽多图上传 → Task 2
- 封面区拖拽单图上传 → Task 3
- 通用 hook 拖拽态/过滤/上传/错误 → Task 1
- 轻量高亮 + "松手上传" 提示 → Task 2 & Task 3
- 非图片文件忽略 → hook 内 `filterImageFiles` 处理
- 浏览器验证 → Task 5
- 不改后端 → 全部前端改动
- 不改 InputField → Task 3 仅外包容器

**2. Placeholder scan:** 无 TBD/TODO/待定。

**3. Type consistency:**
- `useImageDropUpload` 返回 `dragHandlers` 对象，四个事件类型均为 `(e: DragEvent<HTMLElement>) => void`
- Markdown 编辑器 wrapper 是 `<div>`，`DragEvent<HTMLDivElement>` 兼容 `DragEvent<HTMLElement>`
- 封面区 wrapper 也是 `<div>`，同上
- `onUploadSuccess` 签名 `(files: File[], urls: string[]) => Promise<void> | void` 在两个调用方一致

**4. Drag-leave flicker risk:** hook 使用 `dragDepthRef` 计数器避免子元素触发的 dragLeave 闪烁。

**5. Double-upload risk:** 编辑器拆出了 `formatImageAsMarkdown(file, uploadedUrl)` 纯函数，hook 负责上传后返回 URL，回调中直接格式化，不再二次上传。
