/**
 * 管理列表项骨架屏
 */
export function AdminListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="card-base animate-pulse">
			{[...Array(count)].map((_, index) => (
				<div
					key={index}
					className="p-4 flex items-center gap-4 border-b border-[var(--border-light)] last:border-b-0"
				>
					<div className="flex-1">
						<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
						<div className="flex gap-2">
							<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
							<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
							<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
						</div>
					</div>
					<div className="flex gap-1">
						<div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded" />
						<div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded" />
					</div>
				</div>
			))}
		</div>
	);
}
