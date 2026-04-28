export interface ImageDropUploadBatchCallbacks {
	onUploadSuccess: (
		files: File[],
		urls: string[],
		batchId: string,
	) => Promise<void> | void;
	onUploadError?: (error: Error, files: File[], batchId: string) => void;
	onFileUploaded?: (file: File, url: string, batchId: string) => void;
	onFileFailed?: (file: File, error: Error, batchId: string) => void;
	setError: (message: string) => void;
}

export interface RunImageDropUploadBatchOptions
	extends ImageDropUploadBatchCallbacks {
	files: File[];
	batchId: string;
	uploadFile: (file: File) => Promise<string>;
}

function normalizeError(error: unknown): Error {
	return error instanceof Error ? error : new Error("Image upload failed");
}

export function reportImageDropUploadError({
	error,
	files,
	batchId,
	onUploadError,
	setError,
}: {
	error: unknown;
	files: File[];
	batchId: string;
	onUploadError?: (error: Error, files: File[], batchId: string) => void;
	setError: (message: string) => void;
}): void {
	const normalizedError = normalizeError(error);
	setError(normalizedError.message);

	try {
		onUploadError?.(normalizedError, files, batchId);
	} catch (callbackError: unknown) {
		setError(normalizeError(callbackError).message);
	}
}

export async function runImageDropUploadBatch({
	files,
	batchId,
	uploadFile,
	onUploadSuccess,
	onUploadError,
	onFileUploaded,
	onFileFailed,
	setError,
}: RunImageDropUploadBatchOptions): Promise<void> {
	const urls: string[] = [];
	const successFiles: File[] = [];
	let lastError: Error | null = null;

	for (const file of files) {
		try {
			const url = await uploadFile(file);
			urls.push(url);
			successFiles.push(file);
			onFileUploaded?.(file, url, batchId);
		} catch (error: unknown) {
			lastError = normalizeError(error);
			onFileFailed?.(file, lastError, batchId);
		}
	}

	if (successFiles.length > 0) {
		try {
			await onUploadSuccess(successFiles, urls, batchId);
		} catch (error: unknown) {
			lastError = normalizeError(error);
		}
	}

	if (!lastError) {
		return;
	}

	reportImageDropUploadError({
		error: lastError,
		files,
		batchId,
		onUploadError,
		setError,
	});
}
