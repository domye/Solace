import { useState, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import { uploadImage } from "@/api";

interface UseImageDropUploadOptions {
	multiple?: boolean;
	maxFiles?: number;
	onUploadSuccess: (
		files: File[],
		urls: string[],
	) => Promise<void> | void;
	onUploadError?: (error: Error) => void;
	onFilesAccepted?: (files: File[]) => void;
	onFileUploaded?: (file: File, url: string) => void;
	onFileFailed?: (file: File, error: Error) => void;
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
	onFilesAccepted,
	onFileUploaded,
	onFileFailed,
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

			onFilesAccepted?.(accepted);
			setError("");
			setUploadingCount((c) => c + accepted.length);

			(async () => {
				const urls: string[] = [];
				const successFiles: File[] = [];
				let lastError: Error | null = null;

				for (const f of accepted) {
					try {
						const url = await uploadImage(f);
						urls.push(url);
						successFiles.push(f);
						onFileUploaded?.(f, url);
					} catch (err: unknown) {
						lastError = err instanceof Error ? err : new Error("Image upload failed");
						onFileFailed?.(f, lastError);
					}
				}

				if (urls.length > 0) {
					await onUploadSuccess(successFiles, urls);
				}

				if (lastError) {
					setError(lastError.message);
					onUploadError?.(lastError);
				}

				setUploadingCount((c) => Math.max(0, c - accepted.length));
			})();
		},
		[effectiveMax, onUploadSuccess, onUploadError, onFilesAccepted, onFileUploaded, onFileFailed],
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
