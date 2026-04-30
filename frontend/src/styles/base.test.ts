import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message: string): never {
	throw new Error(message);
}

function assertMatches(haystack: string, pattern: RegExp, label: string): void {
	if (!pattern.test(haystack)) {
		fail(`${label}: expected match ${pattern}`);
	}
}

function assertNotMatches(haystack: string, pattern: RegExp, label: string): void {
	if (pattern.test(haystack)) {
		fail(`${label}: unexpected match ${pattern}`);
	}
}

async function run(): Promise<void> {
	const currentDir = dirname(fileURLToPath(import.meta.url));
	const cssPath = resolve(currentDir, "./base.css");
	const css = await readFile(cssPath, "utf8");

	assertMatches(
		css,
		/html\s*\{[\s\S]*?overflow-y:\s*scroll;[\s\S]*?overflow-x:\s*hidden;/,
		"html should remain responsible for horizontal overflow clipping",
	);
	assertNotMatches(
		css,
		/body\s*\{[\s\S]*?overflow-x:\s*hidden;[\s\S]*?\}/,
		"body should not suppress horizontal overflow because it breaks sticky positioning",
	);
}

await run();
