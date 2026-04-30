import { Link } from "react-router-dom";
import { useArchive } from "@/hooks";
import { ErrorDisplay, InlineLoader, EmptyState, PageSEO } from "@/components";
import { CategoryBar } from "@/components/widget";
import { formatShortDate, formatTags } from "@/utils";

export function ArchivePage() {
	const { data: groups, isLoading, isFetching, error } = useArchive();

	if (error) return <ErrorDisplay message="加载归档失败" />;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="card-base p-3 animate-pulse">
					<div className="flex gap-2">
						{[...Array(6)].map((_, i) => (
							<div
								key={i}
								className="h-7 w-16 bg-[var(--btn-regular-bg)] rounded-lg"
							/>
						))}
					</div>
				</div>
				<div className="card-base px-8 py-6 animate-pulse">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="mb-6 last:mb-0">
							<div className="flex flex-row w-full items-center h-[3.75rem]">
								<div className="w-[15%] md:w-[10%] h-6 bg-gray-200 dark:bg-gray-700 rounded" />
								<div className="w-[15%] md:w-[10%] flex justify-center">
									<div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
								</div>
								<div className="w-[70%] md:w-[80%] h-4 bg-gray-200 dark:bg-gray-700 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<PageSEO title="归档" description="按时间归档浏览所有文章" path="/archive" />
			{isFetching && !isLoading && <InlineLoader />}
			<CategoryBar />
			<div className="card-base px-4 md:px-8 py-4 md:py-6 onload-animation">
				{groups?.length ? (
					groups.map((group) => (
						<div key={group.year}>
							<div className="flex flex-row w-full items-center h-14 md:h-[3.75rem]">
								<div className="w-[15%] md:w-[10%] text-xl md:text-2xl font-bold text-right text-75">
									{group.year}
								</div>
								<div className="w-[15%] md:w-[10%]">
									<div className="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3" />
								</div>
								<div className="w-[70%] md:w-[80%] text-left text-50">
									{group.count} 篇文章
								</div>
							</div>
							{group.posts.map((post) => (
								<Link
									key={post.id}
									to={`/articles/${post.slug}`}
									aria-label={post.title}
									className="group btn-plain !block h-9 md:h-10 w-full rounded-lg hover:text-[initial]"
								>
									<div className="flex flex-row justify-start items-center h-full">
										<div className="w-[15%] md:w-[10%] text-xs md:text-sm text-right text-50">
											{formatShortDate(post.published_at || post.created_at)}
										</div>
										<div className="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
											<div className="transition-all duration-300 ease-out mx-auto w-1 h-1 rounded group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)] outline outline-4 z-50 outline-[var(--card-bg)] group-hover:outline-[var(--btn-plain-bg-hover)] group-active:outline-[var(--btn-plain-bg-active)]" />
										</div>
										<div className="w-[70%] md:max-w-[65%] text-left font-bold group-hover:translate-x-1 transition-all duration-300 ease-out group-hover:text-[var(--primary)] text-75 pr-8 truncate">
											{post.title}
										</div>
										<div className="hidden md:block md:w-[15%] text-left text-sm text-30 truncate">
											{formatTags(post.tags)}
										</div>
									</div>
								</Link>
							))}
						</div>
					))
				) : (
					<EmptyState message="暂无文章" />
				)}
			</div>
		</div>
	);
}
