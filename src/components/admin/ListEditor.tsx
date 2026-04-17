/**
 * 通用列表编辑器组件
 *
 * 用于可视化编辑列表数据，支持增删改、排序
 */

import { useState, useCallback } from "react";
import { SafeIcon } from "@/components/common/ui";

export interface ListEditorConfig<T> {
	/** 列表项的标签 */
	itemLabel: string;
	/** 唯一标识字段名（用于 React key） */
	idField: keyof T;
	/** 显示字段名（用于列表展示） */
	displayField: keyof T;
	/** 列表项次要显示字段 */
	secondaryFields?: (keyof T)[];
	/** 字段配置 */
	fields: ListEditorField<T>[];
	/** 创建空项的函数 */
	createEmpty: () => T;
	/** 自定义渲染函数（可选） */
	renderItem?: (item: T) => React.ReactNode;
	/** 自动排序字段（可选） */
	sortField?: keyof T;
	/** 排序方向：desc 为降序（最新的在前），asc 为升序（最旧的在前） */
	sortDirection?: "asc" | "desc";
	/** 是否显示手动排序按钮 */
	enableManualSort?: boolean;
}

export interface ListEditorField<T> {
	/** 字段名 */
	name: keyof T;
	/** 字段标签 */
	label: string;
	/** 字段类型 */
	type: "text" | "url" | "textarea" | "select" | "tags" | "coords" | "date";
	/** 是否必填 */
	required?: boolean;
	/** 占位符 */
	placeholder?: string;
	/** 帮助文本 */
	help?: string;
	/** select 类型的选项 */
	options?: { value: string; label: string; icon?: string }[];
	/** 默认值（用于新项） */
	defaultValue?: string | string[] | { lat: number; lng: number };
}

interface ListEditorProps<T> {
	items: T[];
	onChange: (items: T[]) => void;
	config: ListEditorConfig<T>;
}

export function ListEditor<T extends object>({
	items,
	onChange,
	config,
}: ListEditorProps<T>) {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<T>(config.createEmpty());
	const [tagsInput, setTagsInput] = useState<Record<string, string>>({});

	const handleAddItem = useCallback(() => {
		setEditingIndex(items.length);
		setEditForm(config.createEmpty());
		setTagsInput({});
	}, [items.length, config]);

	const handleEditItem = useCallback(
		(index: number) => {
			setEditingIndex(index);
			setEditForm(items[index] || config.createEmpty());
			setTagsInput({});
		},
		[items, config],
	);

	const handleDeleteItem = useCallback(
		(index: number) => {
			onChange(items.filter((_, i) => i !== index));
			if (editingIndex === index) {
				setEditingIndex(null);
			}
		},
		[items, editingIndex, onChange],
	);

	const handleSaveEdit = useCallback(() => {
		const requiredFields = config.fields.filter((f) => f.required);
		const isValid = requiredFields.every((f) => {
			const value = editForm[f.name];
			if (typeof value === "string") return value.trim().length > 0;
			return value !== undefined && value !== null;
		});

		if (!isValid) return;

		let newItems: T[];
		if (editingIndex === items.length) {
			newItems = [...items, editForm];
		} else if (editingIndex !== null && items[editingIndex]) {
			newItems = items.map((item, i) => (i === editingIndex ? editForm : item));
		} else {
			newItems = items;
		}

		// 自动排序
		if (config.sortField) {
			newItems.sort((a, b) => {
				const aValue = a[config.sortField!];
				const bValue = b[config.sortField!];
				const aStr = typeof aValue === "string" ? aValue : String(aValue || "");
				const bStr = typeof bValue === "string" ? bValue : String(bValue || "");
				const cmp = aStr.localeCompare(bStr);
				return config.sortDirection === "desc" ? -cmp : cmp;
			});
		}

		onChange(newItems);
		setEditingIndex(null);
		setEditForm(config.createEmpty());
		setTagsInput({});
	}, [editForm, editingIndex, items, onChange, config]);

	const handleCancelEdit = useCallback(() => {
		setEditingIndex(null);
		setEditForm(config.createEmpty());
		setTagsInput({});
	}, [config]);

	const handleMoveUp = useCallback(
		(index: number) => {
			if (index === 0) return;
			const newItems = [...items];
			const prev = newItems[index - 1];
			const curr = newItems[index];
			if (prev && curr) {
				newItems[index - 1] = curr;
				newItems[index] = prev;
				onChange(newItems);
			}
		},
		[items, onChange],
	);

	const handleMoveDown = useCallback(
		(index: number) => {
			if (index === items.length - 1) return;
			const newItems = [...items];
			const curr = newItems[index];
			const next = newItems[index + 1];
			if (curr && next) {
				newItems[index] = next;
				newItems[index + 1] = curr;
				onChange(newItems);
			}
		},
		[items, onChange],
	);

	const handleFieldChange = useCallback(
		(fieldName: keyof T, value: unknown) => {
			setEditForm((prev) => ({ ...prev, [fieldName]: value }));
		},
		[],
	);

	const handleAddTag = useCallback(
		(fieldName: keyof T) => {
			const inputValue = tagsInput[String(fieldName)] || "";
			if (!inputValue.trim()) return;

			const currentTags = (editForm[fieldName] as string[] | undefined) || [];
			if (!currentTags.includes(inputValue.trim())) {
				handleFieldChange(fieldName, [...currentTags, inputValue.trim()]);
			}
			setTagsInput((prev) => ({ ...prev, [String(fieldName)]: "" }));
		},
		[tagsInput, editForm, handleFieldChange],
	);

	const handleRemoveTag = useCallback(
		(fieldName: keyof T, tag: string) => {
			const currentTags = (editForm[fieldName] as string[] | undefined) || [];
			handleFieldChange(
				fieldName,
				currentTags.filter((t) => t !== tag),
			);
		},
		[editForm, handleFieldChange],
	);

	const getDisplayValue = (item: T): string => {
		const value = item[config.displayField];
		if (typeof value === "string") return value;
		return String(value || "");
	};

	const getSecondaryValues = (item: T): string[] => {
		if (!config.secondaryFields) return [];
		return config.secondaryFields
			.map((field) => {
				const value = item[field];
				if (typeof value === "string") return value;
				if (Array.isArray(value)) return value.join(", ");
				return "";
			})
			.filter(Boolean);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-75 font-medium">{config.itemLabel}</h3>
				<button
					type="button"
					onClick={handleAddItem}
					className="btn-regular btn-sm py-1.5 px-3 flex items-center gap-1"
				>
					<SafeIcon icon="material-symbols:add-rounded" size={16} />
					添加
				</button>
			</div>

			{editingIndex !== null && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<h4 className="text-75 font-medium text-sm">
						{editingIndex === items.length
							? `添加新${config.itemLabel}`
							: `编辑${config.itemLabel}`}
					</h4>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{config.fields.map((field) => {
							const isFullWidth =
								field.type === "textarea" || field.type === "tags";
							const fieldKey = String(field.name);

							return (
								<div
									key={fieldKey}
									className={isFullWidth ? "md:col-span-2" : ""}
								>
									<label className="block text-50 text-xs mb-1">
										{field.label}
										{field.required && (
											<span className="text-red-400 ml-1">*</span>
										)}
									</label>

									{field.type === "text" ||
									field.type === "url" ||
									field.type === "date" ? (
										<input
											type={
												field.type === "url"
													? "url"
													: field.type === "date"
														? "date"
														: "text"
											}
											value={(editForm[field.name] as string | undefined) || ""}
											onChange={(e) =>
												handleFieldChange(field.name, e.target.value)
											}
											placeholder={field.placeholder}
											className="input-base"
										/>
									) : field.type === "textarea" ? (
										<textarea
											value={(editForm[field.name] as string | undefined) || ""}
											onChange={(e) =>
												handleFieldChange(field.name, e.target.value)
											}
											placeholder={field.placeholder}
											rows={3}
											className="input-base"
										/>
									) : field.type === "select" ? (
										<div className="flex gap-2">
											{field.options?.map((opt) => (
												<button
													key={opt.value}
													type="button"
													onClick={() =>
														handleFieldChange(field.name, opt.value)
													}
													className={`rounded-[var(--radius-medium)] py-1.5 px-3 text-sm flex items-center gap-1 transition-all ${
														editForm[field.name] === opt.value
															? "btn-primary btn-sm py-1 px-2.5"
															: "btn-regular"
													}`}
												>
													{opt.icon && <SafeIcon icon={opt.icon} size={14} />}
													{opt.label}
												</button>
											))}
										</div>
									) : field.type === "tags" ? (
										<div className="space-y-2">
											<div className="flex gap-2">
												<input
													type="text"
													value={tagsInput[fieldKey] || ""}
													onChange={(e) =>
														setTagsInput((prev) => ({
															...prev,
															[fieldKey]: e.target.value,
														}))
													}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															handleAddTag(field.name);
														}
													}}
													placeholder={field.placeholder || "输入后按 Enter"}
													className="input-base flex-1"
												/>
												<button
													type="button"
													onClick={() => handleAddTag(field.name)}
													className="btn-regular btn-sm px-2.5"
												>
													添加
												</button>
											</div>
											{Array.isArray(editForm[field.name]) &&
												(editForm[field.name] as string[]).length > 0 && (
													<div className="flex flex-wrap gap-1">
														{(editForm[field.name] as string[]).map(
															(tag: string) => (
																<span
																	key={tag}
																	className="bg-[var(--primary)]/20 text-[var(--primary)] rounded-[var(--radius-small)] px-2 py-0.5 text-xs flex items-center gap-1"
																>
																	{tag}
																	<button
																		type="button"
																		onClick={() =>
																			handleRemoveTag(field.name, tag)
																		}
																		className="hover:bg-white/20 rounded"
																	>
																		<SafeIcon
																			icon="material-symbols:close-rounded"
																			size={12}
																		/>
																	</button>
																</span>
															),
														)}
													</div>
												)}
										</div>
									) : field.type === "coords" ? (
										<div className="flex gap-2">
											<div className="flex-1">
												<input
													type="number"
													step="any"
													value={
														(
															editForm[field.name] as
																| { lat: number; lng: number }
																| undefined
														)?.lat || ""
													}
													onChange={(e) =>
														handleFieldChange(field.name, {
															...(editForm[field.name] as object),
															lat: Number(e.target.value),
														})
													}
													placeholder="纬度 (lat)"
													className="input-base"
												/>
											</div>
											<div className="flex-1">
												<input
													type="number"
													step="any"
													value={
														(
															editForm[field.name] as
																| { lat: number; lng: number }
																| undefined
														)?.lng || ""
													}
													onChange={(e) =>
														handleFieldChange(field.name, {
															...(editForm[field.name] as object),
															lng: Number(e.target.value),
														})
													}
													placeholder="经度 (lng)"
													className="input-base"
												/>
											</div>
										</div>
									) : null}

									{field.help && (
										<p className="text-40 text-xs mt-0.5">{field.help}</p>
									)}
								</div>
							);
						})}
					</div>

					<div className="flex gap-2 pt-2">
						<button
							type="button"
							onClick={handleSaveEdit}
							className="btn-primary btn-sm py-1.5 px-3"
						>
							保存
						</button>
						<button
							type="button"
							onClick={handleCancelEdit}
							className="btn-plain btn-sm py-1.5 px-3"
						>
							取消
						</button>
					</div>
				</div>
			)}

			{items.length > 0 && editingIndex === null && (
				<div className="space-y-2">
					{items.map((item, index) => (
						<div
							key={String(item[config.idField] || index)}
							className="card-base p-3 flex items-center gap-3 group"
						>
							{(config.enableManualSort ?? !config.sortField) && (
								<div className="flex items-center gap-1 text-40">
									<button
										type="button"
										onClick={() => handleMoveUp(index)}
										disabled={index === 0}
										className="p-1 hover:text-75 disabled:opacity-30 disabled:cursor-not-allowed"
										title="上移"
									>
										<SafeIcon
											icon="material-symbols:arrow-upward-rounded"
											size={16}
										/>
									</button>
									<button
										type="button"
										onClick={() => handleMoveDown(index)}
										disabled={index === items.length - 1}
										className="p-1 hover:text-75 disabled:opacity-30 disabled:cursor-not-allowed"
										title="下移"
									>
										<SafeIcon
											icon="material-symbols:arrow-downward-rounded"
											size={16}
										/>
									</button>
								</div>
							)}

							<div className="flex-1 min-w-0">
								<div className="text-75 font-medium truncate">
									{getDisplayValue(item)}
								</div>
								{getSecondaryValues(item).length > 0 && (
									<div className="text-50 text-xs truncate mt-0.5">
										{getSecondaryValues(item).join(" · ")}
									</div>
								)}
								{config.renderItem && config.renderItem(item)}
							</div>

							<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onClick={() => handleEditItem(index)}
									className="p-1.5 hover:bg-[var(--btn-regular-bg-hover)] rounded-[var(--radius-small)] text-50 hover:text-75"
									title="编辑"
								>
									<SafeIcon
										icon="material-symbols:edit-outline-rounded"
										size={16}
									/>
								</button>
								<button
									type="button"
									onClick={() => handleDeleteItem(index)}
									className="p-1.5 hover:bg-red-500/10 rounded-[var(--radius-small)] text-50 hover:text-red-500"
									title="删除"
								>
									<SafeIcon
										icon="material-symbols:delete-outline-rounded"
										size={16}
									/>
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{items.length === 0 && editingIndex === null && (
				<div className="card-base p-4 text-center text-50">
					<p>暂无数据，点击上方按钮添加</p>
				</div>
			)}
		</div>
	);
}
