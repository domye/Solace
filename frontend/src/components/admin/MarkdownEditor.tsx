import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
import { uploadImage } from "@/api";
import { useImageSettings } from "@/hooks";
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
		() => createMarkdownParser(imageSettings?.maxWidth ?? DEFAULT_IMAGE_MAX_WIDTH),
		[imageSettings?.maxWidth],
	);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const valueRef = useRef(value);

	// Remount once when async content arrives so undo history starts at the loaded baseline.
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

	const uploadImageAsMarkdown = async (file: File) => {
		const alt = escapeMarkdownText(
			file.name?.replace(/\.[^.]+$/, "") || "pasted-image",
		);
		const uploadedUrl = await uploadImage(file);
		const url = imageSettings?.appendWidthToPastedImages ?? true
			? appendImageWidthParam(
					uploadedUrl,
					imageSettings?.defaultWidth ?? DEFAULT_IMAGE_WIDTH,
				)
			: uploadedUrl;
		return `![${alt}](${url})`;
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
			const markdownImages = await Promise.all(files.map(uploadImageAsMarkdown));
			insertMarkdown(markdownImages.join("\n\n"));
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : "Image upload failed",
			);
		} finally {
			setUploadingCount((count) => Math.max(0, count - files.length));
		}
	};

	return (
		<div
			ref={wrapperRef}
			aria-busy={uploadingCount > 0}
			className="markdown-editor-wrapper relative h-full"
			onPasteCapture={handlePaste}
		>
			{uploadError && (
				<div
					role="alert"
					className="mb-2 rounded-[var(--radius-medium)] bg-red-500/10 p-2 text-sm text-red-500"
				>
					{uploadError}
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
					<span>{uploadingCount > 1 ? `${uploadingCount} 张图片上传中` : "图片上传中"}</span>
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
