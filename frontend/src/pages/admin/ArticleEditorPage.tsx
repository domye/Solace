import { useEffect, useRef, useState } from "react";
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
	useImageDropUpload,
} from "@/hooks";
import { LoadingButton, InputField, TextAreaField } from "@/components";
import { LazyMarkdownEditor } from "@/components/admin";
import { request_CreateArticleRequest } from "@/api";

type ArticleStatus = request_CreateArticleRequest.status;

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

function normalizeCategoryId(categoryId: number | undefined): number | undefined {
	if (typeof categoryId !== "number" || Number.isNaN(categoryId)) {
		return undefined;
	}
	return categoryId;
}

export function ArticleEditorPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);
	const isSubmittingRef = useRef(false);
	const [pendingAction, setPendingAction] = useState<ArticleStatus | null>(null);
	const [saveError, setSaveError] = useState("");

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

	const selectedTagIds = watch("tag_ids") ?? [];
	const currentStatus = watch("status");
	const coverImage = watch("cover_image") ?? "";
	const categoryId = watch("category_id");
	const isSaving = createMutation.isPending || updateMutation.isPending;
	const formError =
		saveError ||
		errors.title?.message ||
		errors.content?.message ||
		errors.cover_image?.message ||
		"";

	const {
		isDragActive: isCoverDragActive,
		isUploading: isCoverUploading,
		error: coverUploadError,
		dragHandlers: coverDragHandlers,
	} = useImageDropUpload({
		multiple: false,
		onUploadSuccess: (_files, urls) => {
			if (urls[0]) {
				setValue("cover_image", urls[0], {
					shouldDirty: true,
					shouldValidate: true,
				});
			}
		},
	});

	useEffect(() => {
		if (!existingArticle) {
			return;
		}

		reset({
			title: existingArticle.title,
			slug: existingArticle.slug || "",
			content: existingArticle.content,
			summary: existingArticle.summary || "",
			cover_image: existingArticle.cover_image || "",
			category_id: existingArticle.category?.id,
			tag_ids: existingArticle.tags?.map((tag) => tag.id) || [],
			status: existingArticle.status as ArticleStatus,
		});
	}, [existingArticle, reset]);

	const toggleTag = (tagId: number) => {
		const nextTagIds = selectedTagIds.includes(tagId)
			? selectedTagIds.filter((currentId) => currentId !== tagId)
			: [...selectedTagIds, tagId];

		setValue("tag_ids", nextTagIds, {
			shouldDirty: true,
			shouldValidate: true,
		});
	};

	const submitArticle = async (
		data: ArticleFormData,
		nextStatus: ArticleStatus,
	) => {
		if (isSubmittingRef.current || isSaving) {
			return;
		}

		isSubmittingRef.current = true;
		setSaveError("");

		try {
			const articleData: request_CreateArticleRequest = {
				title: data.title.trim(),
				slug: data.slug?.trim() || undefined,
				content: data.content,
				summary: data.summary?.trim() || undefined,
				cover_image: data.cover_image?.trim() || undefined,
				category_id: normalizeCategoryId(data.category_id),
				tag_ids: data.tag_ids && data.tag_ids.length > 0 ? data.tag_ids : undefined,
				status: nextStatus,
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
				return;
			}

			await createMutation.mutateAsync(articleData);
			navigate("/admin");
		} catch (error: unknown) {
			setSaveError(error instanceof Error ? error.message : "保存失败");
		} finally {
			isSubmittingRef.current = false;
			setPendingAction(null);
		}
	};

	const handleInvalidSubmit = () => {
		setPendingAction(null);
	};

	const handleDraftSave = () => {
		setPendingAction(request_CreateArticleRequest.status.DRAFT);
		setValue("status", request_CreateArticleRequest.status.DRAFT, {
			shouldDirty: true,
		});
		void handleSubmit(
			(data) => submitArticle(data, request_CreateArticleRequest.status.DRAFT),
			handleInvalidSubmit,
		)();
	};

	const handlePublishSave = () => {
		setPendingAction(request_CreateArticleRequest.status.PUBLISHED);
		setValue("status", request_CreateArticleRequest.status.PUBLISHED, {
			shouldDirty: true,
		});
		void handleSubmit(
			(data) => submitArticle(data, request_CreateArticleRequest.status.PUBLISHED),
			handleInvalidSubmit,
		)();
	};

	return (
		<form
			onSubmit={handleSubmit(
				(data) => submitArticle(data, data.status),
				handleInvalidSubmit,
			)}
			className="space-y-4"
		>
			{formError && (
				<div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
					{formError}
				</div>
			)}

			<div className="card-base p-6 h-[calc(100vh-12rem)] flex flex-col !transform:none hover:!transform:none hover:!shadow-[var(--showa-shadow-offset)_var(--showa-shadow-offset)_0_var(--showa-shadow-color)]">
				<InputField
					label="标题"
					value={watch("title") || ""}
					onChange={(value) =>
						setValue("title", value, {
							shouldDirty: true,
							shouldValidate: true,
						})
					}
					placeholder="文章标题"
					required
					error={errors.title?.message}
				/>
				<div className="flex-1 min-h-0 mt-4">
					<Controller
						name="content"
						control={control}
						render={({ field }) => (
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
						<label
							htmlFor="article-slug"
							className="block text-75 text-sm font-medium mb-2"
						>
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
					<div
						className="relative"
						onDragEnter={coverDragHandlers.onDragEnter}
						onDragOver={coverDragHandlers.onDragOver}
						onDragLeave={coverDragHandlers.onDragLeave}
						onDrop={coverDragHandlers.onDrop}
					>
						<InputField
							label="封面图片"
							value={coverImage}
							onChange={(value) =>
								setValue("cover_image", value, {
									shouldDirty: true,
									shouldValidate: true,
								})
							}
							placeholder="https://example.com/cover.jpg"
							type="url"
							error={errors.cover_image?.message}
						/>
						{isCoverDragActive && (
							<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-medium)] border-2 border-dashed border-sky-400 bg-sky-50/80 dark:bg-sky-900/30">
								<span className="text-sm font-medium text-sky-600 dark:text-sky-300">
									松手上传
								</span>
							</div>
						)}
						{isCoverUploading && (
							<div className="pointer-events-none absolute right-3 top-9 z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
								<div
									aria-hidden="true"
									className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400"
								/>
								<span>封面上传中</span>
							</div>
						)}
						{coverUploadError && (
							<p className="mt-1 text-xs text-red-500">{coverUploadError}</p>
						)}
					</div>
				</div>

				<TextAreaField
					label="摘要"
					value={watch("summary") || ""}
					onChange={(value) =>
						setValue("summary", value, {
							shouldDirty: true,
						})
					}
					placeholder="文章简要摘要"
					rows={2}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="article-category"
							className="block text-75 text-sm font-medium mb-2"
						>
							分类
						</label>
						<select
							id="article-category"
							value={categoryId?.toString() ?? ""}
							onChange={(event) =>
								setValue(
									"category_id",
									event.target.value ? Number(event.target.value) : undefined,
									{
										shouldDirty: true,
										shouldValidate: true,
									},
								)
							}
							className="input-base"
						>
							<option value="">无分类</option>
							{categories?.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
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
						{Object.values(request_CreateArticleRequest.status).map((statusValue) => (
							<button
								key={statusValue}
								type="button"
								onClick={() =>
									setValue("status", statusValue, {
										shouldDirty: true,
									})
								}
								className={`btn-regular btn-sm py-1.5 px-3 ${
									currentStatus === statusValue
										? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
										: ""
								}`}
							>
								{statusValue === request_CreateArticleRequest.status.PUBLISHED
									? "发布"
									: "草稿"}
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
							type="button"
							onClick={handleDraftSave}
							loading={pendingAction === request_CreateArticleRequest.status.DRAFT}
							disabled={isSaving}
							className="btn-regular btn-sm py-1.5 px-4"
						>
							{isEdit ? "保存草稿" : "创建草稿"}
						</LoadingButton>
						<LoadingButton
							type="button"
							onClick={handlePublishSave}
							loading={pendingAction === request_CreateArticleRequest.status.PUBLISHED}
							disabled={isSaving}
							className="btn-regular btn-sm py-1.5 px-4 border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
						>
							{isEdit ? "发布更新" : "发布文章"}
						</LoadingButton>
					</div>
				</div>
			</div>
		</form>
	);
}
