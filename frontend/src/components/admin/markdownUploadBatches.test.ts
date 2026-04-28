function fail(message: string): never {
	throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
	if (actual !== expected) {
		fail(`${label}: expected ${String(expected)}, got ${String(actual)}`);
	}
}

function assertDeepEqual(actual: unknown, expected: unknown, label: string): void {
	const actualJson = JSON.stringify(actual);
	const expectedJson = JSON.stringify(expected);
	if (actualJson !== expectedJson) {
		fail(`${label}: expected ${expectedJson}, got ${actualJson}`);
	}
}

async function run(): Promise<void> {
	const { createMarkdownUploadBatchTracker } = await import("./markdownUploadBatches.ts");

	const tracker = createMarkdownUploadBatchTracker();
	const duplicateA = new File(["a"], "dup-name.png", {
		type: "image/png",
		lastModified: 1714320000999,
	});
	const duplicateB = new File(["a"], "dup-name.png", {
		type: "image/png",
		lastModified: 1714320000999,
	});

	const firstBatchId = "batch-1";
	const secondBatchId = "batch-2";
	tracker.register(firstBatchId, [101]);
	tracker.register(secondBatchId, [202]);

	const uploadItems = [
		{ id: 101, fileName: "dup-name.png", status: "uploading" as const },
		{ id: 202, fileName: "dup-name.png", status: "uploading" as const },
	];

	assertEqual(
		tracker.findUploadingItemId(firstBatchId, duplicateA, uploadItems),
		101,
		"first batch should resolve its own uploading item",
	);
	assertEqual(
		tracker.findUploadingItemId(secondBatchId, duplicateB, uploadItems),
		202,
		"second batch should resolve its own uploading item even if names match",
	);

	assertDeepEqual(
		tracker.takeBatchIds(firstBatchId),
		[101],
		"first batch cleanup should only include first ids",
	);
	assertDeepEqual(
		tracker.takeBatchIds(secondBatchId),
		[202],
		"second batch cleanup should only include second ids",
	);
}

await run();
