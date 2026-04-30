import { renderToStaticMarkup } from "react-dom/server";

function fail(message: string): never {
	throw new Error(message);
}

function assertIncludes(haystack: string, needle: string, label: string): void {
	if (!haystack.includes(needle)) {
		fail(`${label}: expected to include ${needle}, got ${haystack}`);
	}
}

function assertNotIncludes(haystack: string, needle: string, label: string): void {
	if (haystack.includes(needle)) {
		fail(`${label}: expected to exclude ${needle}, got ${haystack}`);
	}
}

function createStorageMock(): Storage {
	const store = new Map<string, string>();

	return {
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.get(key) ?? null;
		},
		key(index: number) {
			return Array.from(store.keys())[index] ?? null;
		},
		removeItem(key: string) {
			store.delete(key);
		},
		setItem(key: string, value: string) {
			store.set(key, value);
		},
	};
}

async function run(): Promise<void> {
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		writable: true,
		value: createStorageMock(),
	});
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		writable: true,
		value: {
			fetch: async () => new Response(null, { status: 200 }),
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			dispatchEvent: () => true,
			localStorage: globalThis.localStorage,
			location: {
				origin: "http://localhost:3000",
				href: "http://localhost:3000/articles/test",
				pathname: "/articles/test",
			},
		},
	});

	const { TableOfContents } = await import("./TableOfContents");
	const html = renderToStaticMarkup(
		<TableOfContents
			headings={[
				{ id: "intro", text: "介绍", depth: 1 },
				{ id: "details", text: "细节", depth: 2 },
			]}
		/>,
	);

	assertIncludes(
		html,
		'class="card-base pb-4 onload-animation flex flex-col overflow-hidden',
		"toc root should use a bounded flex column layout",
	);
	assertIncludes(
		html,
		"min-h-0",
		"toc root should allow the scroll area to shrink inside the sticky column",
	);
	assertIncludes(
		html,
		'toc-scroll-container flex-1 overflow-y-auto overflow-x-hidden',
		"toc scroll container should own the remaining height",
	);
	assertNotIncludes(
		html,
		"max-h-[calc(100vh-280px)]",
		"toc scroll container should not rely on a hardcoded viewport subtraction",
	);
}

await run();
