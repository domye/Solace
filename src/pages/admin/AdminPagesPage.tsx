/**
 * 管理页面列表
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePages, useDeletePage } from "@/hooks";
import {
	Pagination,
	AdminListSkeleton,
	ErrorDisplay,
	EmptyState,
	ActionButton,
} from "@/components";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils";

// 模板类型标签
const templateLabels: Record<string, string> = {
	default: "默认",
	about: "关于我",
	projects: "项目",
	footprints: "足迹",
};

export function AdminPagesPage() {
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<
		"all" | "draft" | "published"
	>("all");
	const [templateFilter, setTemplateFilter] = useState<
		"all" | "default" | "about" | "projects" | "footprints"
	>("all");
	const pageSize = 10;

	const { accessToken, isAuthenticated } = useAuthStore();
	const { data, isLoading, error } = usePages({
		page,
		pageSize,
		status: statusFilter === "all" ? undefined : statusFilter,
		template: templateFilter === "all" ? undefined : templateFilter,
	});

	const deleteMutation = useDeletePage();

	const handleDelete = async (id: number) => {
		if (!confirm("确定要删除这个页面吗？")) return;
		try {
			await deleteMutation.mutateAsync(id);
		} catch (err) {
			alert(err instanceof Error ? err.message : "删除失败");
		}
	};

	if (!isAuthenticated || !accessToken) return null;

	if (error) {
		return <ErrorDisplay message="加载页面列表失败" />;
	}

	const pages = data?.data ?? [];
	const total = data?.total ?? 0;

	const statusLabels = {
		all: "全部",
		published: "已发布",
		draft: "草稿",
	};

	return (
		<div className="space-y-4">
			{/* 状态筛选和新建按钮 */}
			<div className="card-base p-4 fade-in-up flex items-center justify-between flex-wrap gap-4">
				<div className="flex gap-4 flex-wrap">
					{/* 状态筛选 */}
					<div className="flex gap-2">
						{(["all", "published", "draft"] as const).map((status) => (
							<button
								key={status}
								onClick={() => setStatusFilter(status)}
								className={`btn-regular btn-sm py-1 px-2.5 ${
									statusFilter === status
										? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
										: ""
								}`}
							>
								{statusLabels[status]}
							</button>
						))}
					</div>

					{/* 模板筛选 */}
					<div className="flex gap-2">
						{(
							["all", "default", "about", "projects", "footprints"] as const
						).map((template) => (
							<button
								key={template}
								onClick={() => setTemplateFilter(template)}
								className={`btn-regular btn-sm py-1 px-2.5 ${
									templateFilter === template
										? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
										: ""
								}`}
							>
								{templateLabels[template] || template}
							</button>
						))}
					</div>
				</div>

				<Link to="/admin/pages/new" className="btn-regular btn-sm py-1.5 px-3">
					新建页面
				</Link>
			</div>

			{/* 页面列表 */}
			{isLoading ? (
				<AdminListSkeleton count={pageSize} />
			) : pages.length === 0 ? (
				<EmptyState
					icon="material-symbols:article-outline-rounded"
					message="未找到页面"
				/>
			) : (
				<div
					className="card-base fade-in-up"
					style={{ animationDelay: "0.1s" }}
				>
					<div className="divide-y divide-[var(--border-light)]">
						{pages.map((pg) => (
							<div
								key={pg.id}
								className="p-4 flex items-center gap-4 hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
							>
								<div className="flex-1 min-w-0">
									<Link
										to={`/admin/pages/${pg.id}/edit`}
										className="text-90 font-bold hover:text-[var(--primary)] transition-colors block mb-1"
									>
										{pg.title}
									</Link>
									<div className="flex items-center gap-2 text-50 text-xs flex-wrap">
										<span>/{pg.slug}</span>
										<span>•</span>
										<span>{formatDate(pg.created_at)}</span>
										<span>•</span>
										<span
											className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
												pg.status === "published"
													? "bg-green-500/10 text-green-600 dark:text-green-400"
													: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
											}`}
										>
											{pg.status === "published" ? "已发布" : "草稿"}
										</span>
										<span>•</span>
										<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
											{templateLabels[pg.template] || pg.template}
										</span>
										{pg.show_in_nav && (
											<>
												<span>•</span>
												<span className="text-[var(--primary)]">导航显示</span>
											</>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<ActionButton
										icon="material-symbols:visibility-outline-rounded"
										title="查看"
										href={`/pages/${pg.slug}`}
									/>
									<ActionButton
										icon="material-symbols:edit-outline-rounded"
										title="编辑"
										href={`/admin/pages/${pg.id}/edit`}
									/>
									<ActionButton
										icon="material-symbols:delete-outline-rounded"
										title="删除"
										onClick={() => handleDelete(pg.id)}
										disabled={deleteMutation.isPending}
										danger
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<Pagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={setPage}
			/>
		</div>
	);
}
