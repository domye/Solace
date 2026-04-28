export interface MarkdownUploadBatchItem {
	id: number;
	fileName: string;
	status: "uploading" | "success" | "error";
}

export function createMarkdownUploadBatchTracker() {
	const batches = new Map<string, number[]>();

	return {
		register(batchId: string, ids: number[]): void {
			batches.set(batchId, [...ids]);
		},
		findUploadingItemId(
			batchId: string,
			file: File,
			items: MarkdownUploadBatchItem[],
		): number | undefined {
			const ids = batches.get(batchId) ?? [];
			return ids.find((id) => {
				const item = items.find((entry) => entry.id === id);
				return item?.status === "uploading" && item.fileName === file.name;
			});
		},
		takeBatchIds(batchId: string): number[] {
			const ids = batches.get(batchId) ?? [];
			batches.delete(batchId);
			return ids;
		},
	};
}
