/**
 * 搜索弹窗组件
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEscapeKey } from "@/hooks";
import { useDebouncedCallback } from "use-debounce";
import { SafeIcon } from "@/components/common/ui";
import { apiClient } from "@/api";
import { extractPagedData } from "@/hooks/api/utils";
import type { ArticleSummary } from "@/types";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [results, setResults] = useState<ArticleSummary[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const debouncedSetQuery = useDebouncedCallback((q: string) => {
		setDebouncedQuery(q.trim() ? q : "");
	}, 500);

	useEffect(() => {
		if (query.trim().length >= 2) {
			debouncedSetQuery(query);
		} else {
			setDebouncedQuery("");
			setResults([]);
		}
	}, [query, debouncedSetQuery]);

	useEffect(() => {
		if (!debouncedQuery) {
			setResults([]);
			return;
		}

		const fetchResults = async () => {
			setIsLoading(true);
			try {
				const response = await apiClient.article.getArticlesSearch(
					debouncedQuery,
					1,
					10,
				);
				const data = extractPagedData<ArticleSummary>(response);
				setResults(data.data || []);
			} catch {
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResults();
	}, [debouncedQuery]);

	const handleSelect = useCallback(
		(slug: string) => {
			navigate(`/articles/${slug}`);
			setQuery("");
			setDebouncedQuery("");
			setResults([]);
			onClose();
		},
		[navigate, onClose],
	);

	useEscapeKey(onClose, isOpen);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			setQuery("");
			setDebouncedQuery("");
			setResults([]);
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const showEmpty = query.trim().length >= 2 && !isLoading && !results.length;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-start justify-center pt-20 fade-in-up"
			role="dialog"
			aria-modal="true"
			aria-label="搜索文章"
		>
			<div
				className="absolute inset-0 bg-[var(--klein-blue)]/20 dark:bg-[var(--klein-blue)]/40 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative float-panel w-full max-w-2xl mx-4 overflow-hidden">
				<div className="flex items-center gap-2 p-4 border-b border-[var(--border-light)]">
					<SafeIcon
						icon="material-symbols:search-rounded"
						size="1.5rem"
						className="text-[var(--primary)]"
					/>
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="搜索文章..."
						className="input-base flex-1 border-none shadow-none focus:ring-0"
						autoFocus
						aria-label="搜索关键词"
					/>
					{isLoading && (
						<div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
					)}
					<button
						onClick={onClose}
						className="btn-plain rounded-[var(--radius-medium)] h-10 w-10 scale-animation ripple"
						aria-label="关闭搜索"
					>
						<SafeIcon icon="material-symbols:close-rounded" size="1.25rem" />
					</button>
				</div>

				<div className="max-h-[60vh] overflow-y-auto">
					{showEmpty && (
						<div className="p-8 text-center text-50">
							<SafeIcon
								icon="material-symbols:search-off-rounded"
								size="2.5rem"
								className="mb-2"
							/>
							<p>未找到 "{debouncedQuery}" 的相关文章</p>
						</div>
					)}

					{results.length ? (
						<div className="p-2">
							{results.map((article) => (
								<button
									key={article.id}
									onClick={() => handleSelect(article.slug)}
									className="w-full text-left p-3 rounded-[var(--radius-medium)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors group"
								>
									<div className="flex items-center gap-2">
										<span className="text-90 font-bold group-hover:text-[var(--primary)] transition-colors flex-1">
											{article.title}
										</span>
										<SafeIcon
											icon="material-symbols:chevron-right-rounded"
											size="1.125rem"
											className="text-30 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all"
										/>
									</div>
									{article.summary && (
										<div className="text-50 text-sm line-clamp-1 mt-1">
											{article.summary}
										</div>
									)}
								</button>
							))}
						</div>
					) : null}

					{query.trim().length < 2 && (
						<div className="p-8 text-center text-50">
							<SafeIcon
								icon="material-symbols:search-rounded"
								size="2.5rem"
								className="mb-2 text-[var(--primary)]"
							/>
							<p>输入关键词搜索文章</p>
							<p className="text-xs mt-1">支持标题和内容搜索</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
