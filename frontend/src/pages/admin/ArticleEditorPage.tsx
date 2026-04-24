import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	useArticle,
	useCreateArticle,
	useUpdateArticle,
	useCategories,
	useTags,
} from "@/hooks";
import {
	LoadingButton,
	InputField,
	TextAreaField,
} from "@/components";
import { LazyMarkdownEditor } from "@/components/admin";
import { request_CreateArticleRequest } from "@/api";

const articleSchema = z.object({
	title: z.string().min(1, "标题不能为空"),
	slug: z.string().optional(),
	content: z.string().min(1, "内容不能为空"),
	summary: z.string().optional(),
	cover_image: z.string().url("请输入有效的URL").optional().or(z.literal("")),
	category_id: z.number().optional(),
	tag_ids: z.array(z.number()).optional(),
	status: z.nativeEnum(request_CreateArticleRequest.status),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export function ArticleEditorPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);

	const { data: existingArticle } = useArticle(Number(id) || 0);
	const { data: categories } = useCategories();
	const { data: tags } = useTags();
	const createMutation = useCreateArticle();
	const updateMutation = useUpdateArticle();

	const {
		register,
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<ArticleFormData>({
		resolver: zodResolver(articleSchema),
		defaultValues: {
			title: "",
			slug: "",
			content: "",
			summary: "",
			cover_image: "",
			category_id: undefined,
			tag_ids: [],
			status: request_CreateArticleRequest.status.DRAFT,
		},
	});

	const selectedTagIds = watch("tag_ids") || [];

	useEffect(() => {
		if (existingArticle) {
			reset({
				title: existingArticle.title,
				slug: existingArticle.slug || "",
				content: existingArticle.content,
				summary: existingArticle.summary || "",
				cover_image: existingArticle.cover_image || "",
				category_id: existingArticle.category?.id,
				tag_ids: existingArticle.tags?.map((t) => t.id) || [],
				status: existingArticle.status as request_CreateArticleRequest.status,
			});
		}
	}, [existingArticle, reset]);

	const toggleTag = (tagId: number) => {
		const current = selectedTagIds;
		const newTags = current.includes(tagId)
			? current.filter((id: number) => id !== tagId)
			: [...current, tagId];
		setValue("tag_ids", newTags);
	};

	const onSubmit = async (data: ArticleFormData) => {
		try {
			const articleData = {
				...data,
				slug: data.slug?.trim() || undefined,
				cover_image: data.cover_image || undefined,
				tag_ids: data.tag_ids && data.tag_ids.length > 0 ? data.tag_ids : undefined,
			};

			if (isEdit && id) {
				await updateMutation.mutateAsync({
					id: Number(id),
					data: {
						...articleData,
						version: existingArticle?.version || 1,
					},
				});
				navigate("/admin");
			} else {
				await createMutation.mutateAsync(articleData);
				navigate("/admin");
			}
		} catch (err) {
			console.error("Save failed:", err);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			{Object.keys(errors).length > 0 && (
				<div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
					{errors.title?.message || errors.content?.message || "请检查表单内容"}
				</div>
			)}

			<div className="card-base p-6 h-[calc(100vh-12rem)] flex flex-col !transform-none hover:!transform-none hover:!shadow-[var(--showa-shadow-offset)_var(--showa-shadow-offset)_0_var(--showa-shadow-color)]">
				<InputField
					label="标题"
					value={watch("title") || ""}
					onChange={(v) => setValue("title", v)}
					placeholder="文章标题"
					required
					error={errors.title?.message}
				/>
				<div className="flex-1 min-h-0 mt-4">
					<Controller
						name="content"
						control={control}
						render={({ field }: { field: { value: string; onChange: (value: string) => void } }) => (
							<LazyMarkdownEditor
								value={field.value}
								onChange={field.onChange}
								placeholder="在这里撰写 Markdown 内容..."
								height="100%"
							/>
						)}
					/>
				</div>
			</div>

			<div className="card-base p-6 space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="article-slug" className="block text-75 text-sm font-medium mb-2">
							Slug <span className="text-50 text-xs ml-1">(留空自动生成)</span>
						</label>
						<input
							id="article-slug"
							type="text"
							{...register("slug")}
							placeholder="例如: my-first-post"
							className="input-base"
						/>
					</div>
					<InputField
						label="封面图片"
						value={watch("cover_image") || ""}
						onChange={(v) => setValue("cover_image", v)}
						placeholder="https://example.com/cover.jpg"
						type="url"
						error={errors.cover_image?.message}
					/>
				</div>

				<TextAreaField
					label="摘要"
					value={watch("summary") || ""}
					onChange={(v) => setValue("summary", v)}
					placeholder="文章简要摘要"
					rows={2}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="article-category" className="block text-75 text-sm font-medium mb-2">分类</label>
						<select
							id="article-category"
							{...register("category_id", { valueAsNumber: true })}
							className="input-base"
						>
							<option value="">无分类</option>
							{categories?.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-75 text-sm font-medium mb-2">标签</label>
						<div className="flex flex-wrap gap-2">
							{tags?.map((tag) => (
								<button
									key={tag.id}
									type="button"
									onClick={() => toggleTag(tag.id)}
									className={`btn-regular btn-sm py-1 px-2.5 ${
										selectedTagIds.includes(tag.id)
											? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
											: ""
									}`}
								>
									{tag.name}
								</button>
							))}
							{(!tags || tags.length === 0) && (
								<span className="text-50 text-sm">暂无标签</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between pt-4 border-t border-[var(--border-light)]">
					<div className="flex items-center gap-2">
						<label className="text-75 text-sm font-medium">状态</label>
						{Object.values(request_CreateArticleRequest.status).map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setValue("status", s)}
								className={`btn-regular btn-sm py-1.5 px-3 ${
									watch("status") === s
										? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
										: ""
								}`}
							>
								{s === request_CreateArticleRequest.status.PUBLISHED ? "发布" : "草稿"}
							</button>
						))}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => navigate("/admin")}
							className="btn-plain btn-sm py-1.5 px-4"
						>
							取消
						</button>
						<LoadingButton
							type="submit"
							loading={createMutation.isPending || updateMutation.isPending}
							className="btn-regular btn-sm py-1.5 px-4"
						>
							{isEdit ? "更新" : "创建"}
						</LoadingButton>
					</div>
				</div>
			</div>
		</form>
	);
}
