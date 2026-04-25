import { lazy, Suspense } from "react";

const MarkdownEditor = lazy(() =>
	import("./MarkdownEditor").then((m) => ({ default: m.MarkdownEditor })),
);

interface LazyMarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	height?: number | string;
}

export function LazyMarkdownEditor(props: LazyMarkdownEditorProps) {
	return (
		<Suspense
			fallback={
				<div className="h-full flex items-center justify-center bg-[var(--card-bg)] rounded-[var(--radius-medium)]">
					<div className="text-50">加载编辑器...</div>
				</div>
			}
		>
			<MarkdownEditor {...props} />
		</Suspense>
	);
}
