import { useState } from "react";
import {
	useCategories,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
} from "@/hooks";
import {
	AdminListSkeleton,
	ErrorDisplay,
	EmptyState,
	EditDeleteButtons,
	LoadingButton,
	InputField,
	TextAreaField,
} from "@/components";
import type { Category } from "@/types";

export function AdminCategoriesPage() {
	const { data: categories, isLoading, error } = useCategories();
	const createMutation = useCreateCategory();
	const updateMutation = useUpdateCategory();
	const deleteMutation = useDeleteCategory();

	const [showForm, setShowForm] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [sortOrder, setSortOrder] = useState("0");
	const [errorForm, setErrorForm] = useState("");

	const resetForm = () => {
		setName("");
		setSlug("");
		setDescription("");
		setSortOrder("0");
		setErrorForm("");
		setEditingCategory(null);
		setShowForm(false);
	};

	const handleEdit = (category: Category) => {
		setEditingCategory(category);
		setName(category.name);
		setSlug(category.slug);
		setDescription(category.description || "");
		setSortOrder(String(category.sort_order));
		setShowForm(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确定要删除这个分类吗？")) return;
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
			if (editingCategory) {
				await updateMutation.mutateAsync({
					id: editingCategory.id,
					data: {
						name,
						slug: slug || undefined,
						description,
						sort_order: parseInt(sortOrder) || 0,
					},
				});
			} else {
				await createMutation.mutateAsync({
					name,
					slug: slug || undefined,
					description,
					sort_order: parseInt(sortOrder) || 0,
				});
			}
			resetForm();
		} catch (err) {
			setErrorForm(err instanceof Error ? err.message : "保存失败");
		}
	};

	if (error) {
		return <ErrorDisplay message="加载分类列表失败" />;
	}

	return (
		<div className="space-y-4">
			{/* 新建按钮 */}
			<div className="flex justify-end">
				<button
					onClick={() => setShowForm(true)}
					className="btn-regular btn-sm py-1.5 px-3"
				>
					新建分类
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
						placeholder="分类名称"
						required
					/>
					<InputField
						label="Slug"
						value={slug}
						onChange={setSlug}
						placeholder="留空自动生成（基于名称）"
					/>
					<TextAreaField
						label="描述"
						value={description}
						onChange={setDescription}
						placeholder="分类简要描述"
						rows={2}
					/>
					<InputField
						label="排序"
						type="number"
						value={sortOrder}
						onChange={setSortOrder}
						placeholder="排序顺序（数字越小越靠前）"
					/>

					<div className="flex gap-2 mt-4">
						<LoadingButton
							type="submit"
							loading={createMutation.isPending || updateMutation.isPending}
							className="btn-regular btn-sm py-1.5 px-4"
						>
							{editingCategory ? "更新" : "创建"}
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

			{/* 分类列表 */}
			{isLoading ? (
				<AdminListSkeleton count={3} />
			) : !categories || categories.length === 0 ? (
				<EmptyState
					icon="material-symbols:category-outline-rounded"
					message="暂无分类"
				/>
			) : (
				<div
					className="card-base fade-in-up"
					style={{ animationDelay: "0.15s" }}
				>
					<div className="divide-y divide-[var(--border-light)]">
						{categories.map((category) => (
							<div
								key={category.id}
								className="p-4 flex items-center gap-4 hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
							>
								<div className="flex-1 min-w-0">
									<div className="text-90 font-bold mb-1">{category.name}</div>
									<div className="flex items-center gap-2 text-50 text-xs">
										<span>Slug: {category.slug}</span>
										<span>•</span>
										<span className="px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)]">
											{category.article_count || 0} 篇文章
										</span>
										<span>•</span>
										<span>排序: {category.sort_order}</span>
									</div>
									{category.description && (
										<div className="text-50 text-sm mt-1">
											{category.description}
										</div>
									)}
								</div>
								<EditDeleteButtons
									editOnClick={() => handleEdit(category)}
									onDelete={() => handleDelete(category.id)}
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
