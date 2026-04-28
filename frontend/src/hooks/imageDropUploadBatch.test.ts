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
	const { runImageDropUploadBatch } = await import("./imageDropUploadBatch.ts");

	const file = new File(["ok"], "ok.png", {
		type: "image/png",
		lastModified: 1714320000999,
	});
	const uploadedFiles: string[] = [];
	const uploadErrors: Array<{ message: string; files: string[]; batchId: string }> = [];
	const seenErrors: string[] = [];

	await runImageDropUploadBatch({
		files: [file],
		batchId: "drop-1",
		uploadFile: async () => "https://example.com/ok.png",
		onUploadSuccess: async () => {
			throw new Error("callback boom");
		},
		onUploadError: (error, files, batchId) => {
			uploadErrors.push({
				message: error.message,
				files: files.map((entry) => entry.name),
				batchId,
			});
		},
		onFileUploaded: (uploadedFile) => {
			uploadedFiles.push(uploadedFile.name);
		},
		onFileFailed: () => {
			fail("successful upload should not trigger onFileFailed");
		},
		setError: (message) => {
			seenErrors.push(message);
		},
	});

	assertDeepEqual(uploadedFiles, ["ok.png"], "uploaded file should be reported before callback failure");
	assertDeepEqual(seenErrors, ["callback boom"], "callback failure should be surfaced via setError");
	assertEqual(uploadErrors.length, 1, "callback failure should trigger one upload error callback");
	assertDeepEqual(
		uploadErrors[0],
		{ message: "callback boom", files: ["ok.png"], batchId: "drop-1" },
		"upload error callback should receive callback failure context",
	);

	const reportedErrors: string[] = [];
	await runImageDropUploadBatch({
		files: [file],
		batchId: "drop-2",
		uploadFile: async () => {
			throw new Error("upload failed");
		},
		onUploadSuccess: async () => {
			fail("failed upload should not trigger onUploadSuccess");
		},
		onUploadError: () => {
			throw new Error("error callback boom");
		},
		onFileFailed: (failedFile, error) => {
			assertEqual(failedFile.name, "ok.png", "failed file should be reported");
			assertEqual(error.message, "upload failed", "original upload error should be preserved");
		},
		setError: (message) => {
			reportedErrors.push(message);
		},
	});

	assertDeepEqual(reportedErrors, ["upload failed", "error callback boom"], "error callback failure should be handled without rejecting");
}

await run();
