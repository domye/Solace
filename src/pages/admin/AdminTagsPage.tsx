import { useState } from "react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks";
import {
	AdminListSkeleton,
	ErrorDisplay,
	EmptyState,
	EditDeleteButtons,
	LoadingButton,
	InputField,
} from "@/components";
import type { Tag } from "@/types";

export function AdminTagsPage() {
	const { data: tags, isLoading, error } = useTags();
	const createMutation = useCreateTag();
	const updateMutation = useUpdateTag();
	const deleteMutation = useDeleteTag();

	const [showForm, setShowForm] = useState(false);
	const [editingTag, setEditingTag] = useState<Tag | null>(null);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [errorForm, setErrorForm] = useState("");

	const resetForm = () => {
		setName("");
		setSlug("");
		setErrorForm("");
		setEditingTag(null);
		setShowForm(false);
	};

	const handleEdit = (tag: Tag) => {
		setEditingTag(tag);
		setName(tag.name);
		setSlug(tag.slug);
		setShowForm(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定要删除这个标签吗？")) return;
		try {
			await deleteMutation.mutateAsync(id);
		} catch (err) {
			alert(err instanceof Error ? err.message : "删除失败");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorForm("");

		if (!name.trim()) {
			setErrorForm("名称不能为空");
			return;
		}

		try {
			if (editingTag) {
				await updateMutation.mutateAsync({
					id: editingTag.id,
					data: { name, slug: slug || undefined },
				});
			} else {
				await createMutation.mutateAsync({ name, slug: slug || undefined });
			}
			resetForm();
		} catch (err) {
			setErrorForm(err instanceof Error ? err.message : "保存失败");
		}
	};

	if (error) {
		return <ErrorDisplay message="加载标签列表失败" />;
	}

	return (
		<div className="space-y-4">
			{/* 新建按钮 */}
			<div className="flex justify-end">
				<button
					onClick={() => setShowForm(true)}
					className="btn-regular btn-sm py-1.5 px-3"
				>
					新建标签
				</button>
			</div>

			{/* 表单 */}
			{showForm && (
				<form
					onSubmit={handleSubmit}
					className="card-base p-6 fade-in-up"
					style={{ animationDelay: "0.1s" }}
				>
					{errorForm && (
						<div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
							{errorForm}
						</div>
					)}

					<InputField
						label="名称"
						value={name}
						onChange={setName}
						placeholder="标签名称"
						required
					/>
					<InputField
						label="Slug"
						value={slug}
						onChange={setSlug}
						placeholder="留空自动生成（基于名称）"
					/>

					<div className="flex gap-2 mt-4">
						<LoadingButton
							type="submit"
							loading={createMutation.isPending || updateMutation.isPending}
							className="btn-regular btn-sm py-1.5 px-4"
						>
							{editingTag ? "更新" : "创建"}
						</LoadingButton>
						<button
							type="button"
							onClick={resetForm}
							className="btn-plain btn-sm py-1.5 px-4"
						>
							取消
						</button>
					</div>
				</form>
			)}

			{/* 标签列表 */}
			{isLoading ? (
				<AdminListSkeleton count={3} />
			) : !tags || tags.length === 0 ? (
				<EmptyState
					icon="material-symbols:label-outline-rounded"
					message="暂无标签"
				/>
			) : (
				<div
					className="card-base fade-in-up"
					style={{ animationDelay: "0.15s" }}
				>
					<div className="divide-y divide-[var(--border-light)]">
						{tags.map((tag) => (
							<div
								key={tag.id}
								className="p-4 flex items-center gap-4 hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
							>
								<div className="flex-1 min-w-0">
									<div className="text-90 font-bold mb-1">{tag.name}</div>
									<div className="flex items-center gap-2 text-50 text-xs">
										<span>Slug: {tag.slug}</span>
										<span>•</span>
										<span className="px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)]">
											{tag.article_count || 0} 篇文章
										</span>
									</div>
								</div>
								<EditDeleteButtons
									editOnClick={() => handleEdit(tag)}
									onDelete={() => handleDelete(tag.id)}
									deleteDisabled={deleteMutation.isPending}
								/>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
