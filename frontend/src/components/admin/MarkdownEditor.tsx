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

interface UploadItem {
	id: number;
	fileName: string;
	status: "uploading" | "success" | "error";
	error?: string;
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
	const isUserInputRef = useRef(false);
	const nextUploadIdRef = useRef(0);
	const dragDropIdsRef = useRef<number[]>([]);

	const [editorKey, setEditorKey] = useState(0);
	const [isInitialized, setIsInitialized] = useState(false);
	const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
	const [uploadError, setUploadError] = useState("");

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	useEffect(() => {
		if (value && !isInitialized && !isUserInputRef.current) {
			setIsInitialized(true);
			setEditorKey((k) => k + 1);
		}
		isUserInputRef.current = false;
	}, [value, isInitialized]);

	const handleEditorChange = ({ text }: { html: string; text: string }) => {
		isUserInputRef.current = true;
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

	const addUploadItems = (fileNames: string[]): number[] => {
		const items: UploadItem[] = [];
		const ids: number[] = [];
		for (const name of fileNames) {
			const id = nextUploadIdRef.current++;
			ids.push(id);
			items.push({ id, fileName: name, status: "uploading" });
		}
		setUploadItems((prev) => [...prev, ...items]);
		return ids;
	};

	const updateUploadItem = (id: number, status: "success" | "error", error?: string) => {
		setUploadItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, status, error } : item)),
		);
	};

	const scheduleCleanup = (ids: number[], delay = 3000) => {
		setTimeout(() => {
			setUploadItems((prev) => prev.filter((item) => !ids.includes(item.id)));
		}, delay);
	};

	const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
		const files = Array.from(event.clipboardData.files).filter((file) =>
			file.type.startsWith("image/"),
		);

		if (files.length === 0) return;
		event.preventDefault();
		event.stopPropagation();

		setUploadError("");
		const ids = addUploadItems(files.map((f) => f.name));

		const entries = files.map((file, i) => ({ file, id: ids[i]! }));
		const results: string[] = [];
		for (const { file, id } of entries) {
			try {
				const url = await uploadImage(file);
				results.push(formatImageAsMarkdown(file, url));
				updateUploadItem(id, "success");
			} catch (error) {
				const msg = error instanceof Error ? error.message : "Image upload failed";
				updateUploadItem(id, "error", msg);
				setUploadError(msg);
			}
		}

		if (results.length > 0) {
			insertMarkdown(results.join("\n\n"));
		}

		scheduleCleanup(ids);
	};

	const {
		isDragActive,
		error: dropError,
		dragHandlers,
		clearError: clearDropError,
	} = useImageDropUpload({
		multiple: true,
		onFilesAccepted: (files) => {
			setUploadError("");
			const ids = addUploadItems(files.map((f) => f.name));
			dragDropIdsRef.current = ids;
		},
		onFileUploaded: (file) => {
			setUploadItems((prev) => {
				const idx = prev.findIndex(
					(it) => it.status === "uploading" && it.fileName === file.name,
				);
				if (idx === -1) return prev;
				return prev.map((it, i) =>
					i === idx ? { ...it, status: "success" as const } : it,
				);
			});
		},
		onFileFailed: (file, err) => {
			setUploadItems((prev) => {
				const idx = prev.findIndex(
					(it) => it.status === "uploading" && it.fileName === file.name,
				);
				if (idx === -1) return prev;
				return prev.map((it, i) =>
					i === idx
						? { ...it, status: "error" as const, error: err.message }
						: it,
				);
			});
		},
		onUploadSuccess: (files, urls) => {
			const results = files.map((f, i) =>
				formatImageAsMarkdown(f, urls[i] ?? ""),
			);
			if (results.length > 0) {
				insertMarkdown(results.join("\n\n"));
			}
			const ids = dragDropIdsRef.current;
			dragDropIdsRef.current = [];
			if (ids.length > 0) scheduleCleanup(ids);
		},
		onUploadError: () => {
			const ids = dragDropIdsRef.current;
			dragDropIdsRef.current = [];
			if (ids.length > 0) scheduleCleanup(ids);
		},
	});

	const displayError = dropError || uploadError;
	const activeUploading = uploadItems.filter((it) => it.status === "uploading").length;

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
			aria-busy={activeUploading > 0}
			className="markdown-editor-wrapper relative h-full"
			onPasteCapture={handlePaste}
			onDragEnterCapture={handleDragEnter}
			onDragOverCapture={handleDragOver}
			onDragLeaveCapture={handleDragLeave}
			onDropCapture={handleDrop}
		>
			{displayError && (
				<div
					role="alert"
					className="mb-2 rounded-[var(--radius-medium)] bg-red-500/10 p-2 text-sm text-red-500"
				>
					{displayError}
				</div>
			)}
			{uploadItems.length > 0 && (
				<div
					role="status"
					aria-live="polite"
					className="pointer-events-none absolute right-4 top-12 z-20 min-w-[220px] max-w-[320px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 py-2 shadow-lg backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95"
				>
					<div className="px-3 pb-1.5 text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500">
						{activeUploading > 0
							? `${activeUploading} 张图片上传中`
							: "上传完成"}
					</div>
					{uploadItems.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-2.5 px-3 py-1.5"
						>
							{item.status === "uploading" && (
								<div
									aria-hidden="true"
									className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-600 dark:border-t-sky-400"
								/>
							)}
							{item.status === "success" && (
								<svg
									aria-hidden="true"
									className="h-4 w-4 shrink-0 text-emerald-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							)}
							{item.status === "error" && (
								<svg
									aria-hidden="true"
									className="h-4 w-4 shrink-0 text-red-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							)}
							<span
								className="truncate text-sm text-slate-600 dark:text-slate-300"
								title={item.fileName}
							>
								{item.fileName}
							</span>
						</div>
					))}
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
