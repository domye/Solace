/**
 * 分页组件
 *
 * 显示页码导航，支持跳页
 */

import { SafeIcon } from "@/components/common/ui";

interface PaginationProps {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	pageSize,
	total,
	onPageChange,
}: PaginationProps) {
	const totalPages = Math.ceil(total / pageSize);

	if (totalPages <= 1) return null;

	const pages = [];
	const start = Math.max(1, page - 2);
	const end = Math.min(totalPages, page + 2);

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	return (
		<div className="flex items-center justify-center gap-2 mt-2">
			{/* 上一页 */}
			<button
				onClick={() => onPageChange(page - 1)}
				disabled={page === 1}
				className={`btn-regular h-9 w-9 ${
					page === 1 ? "opacity-50 cursor-not-allowed" : ""
				}`}
				aria-label="上一页"
			>
				<SafeIcon icon="material-symbols:chevron-left-rounded" size="1.25rem" />
			</button>

			{/* 首页 */}
			{start > 1 && (
				<>
					<button
						onClick={() => onPageChange(1)}
						className="btn-regular h-9 min-w-[2.25rem] px-2.5"
					>
						1
					</button>
					{start > 2 && <span className="text-30 px-1">...</span>}
				</>
			)}

			{/* 页码 */}
			{pages.map((p) => (
				<button
					key={p}
					onClick={() => onPageChange(p)}
					className={`btn-regular h-9 min-w-[2.25rem] px-2.5 ${
						p === page
							? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
							: ""
					}`}
				>
					{p}
				</button>
			))}

			{/* 末页 */}
			{end < totalPages && (
				<>
					{end < totalPages - 1 && <span className="text-30 px-1">...</span>}
					<button
						onClick={() => onPageChange(totalPages)}
						className="btn-regular h-9 min-w-[2.25rem] px-2.5"
					>
						{totalPages}
					</button>
				</>
			)}

			{/* 下一页 */}
			<button
				onClick={() => onPageChange(page + 1)}
				disabled={page === totalPages}
				className={`btn-regular h-9 w-9 ${
					page === totalPages ? "opacity-50 cursor-not-allowed" : ""
				}`}
				aria-label="下一页"
			>
				<SafeIcon
					icon="material-symbols:chevron-right-rounded"
					size="1.25rem"
				/>
			</button>
		</div>
	);
}
