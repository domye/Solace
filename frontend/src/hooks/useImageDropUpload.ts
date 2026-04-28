import { useState, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import { uploadImage } from "@/api";
import {
	reportImageDropUploadError,
	runImageDropUploadBatch,
} from "./imageDropUploadBatch";

interface UseImageDropUploadOptions {
	multiple?: boolean;
	maxFiles?: number;
	onUploadSuccess: (
		files: File[],
		urls: string[],
		batchId: string,
	) => Promise<void> | void;
	onUploadError?: (error: Error, files: File[], batchId: string) => void;
	onFilesAccepted?: (files: File[], batchId: string) => void;
	onFileUploaded?: (file: File, url: string, batchId: string) => void;
	onFileFailed?: (file: File, error: Error, batchId: string) => void;
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
	const nextBatchIdRef = useRef(0);

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

			const batchId = `drop-${nextBatchIdRef.current++}`;
			onFilesAccepted?.(accepted, batchId);
			setError("");
			setUploadingCount((c) => c + accepted.length);

			void (async () => {
				try {
					await runImageDropUploadBatch({
						files: accepted,
						batchId,
						uploadFile: uploadImage,
						onUploadSuccess,
						onUploadError,
						onFileUploaded,
						onFileFailed,
						setError,
					});
				} catch (error: unknown) {
					reportImageDropUploadError({
						error,
						files: accepted,
						batchId,
						onUploadError,
						setError,
					});
				} finally {
					setUploadingCount((c) => Math.max(0, c - accepted.length));
				}
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
