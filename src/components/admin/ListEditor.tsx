/**
 * 通用列表编辑器组件
 *
 * 用于可视化编辑列表数据，支持增删改、排序
 */
import { useState, useCallback } from "react";
import {
	InputField,
	TextAreaField,
	SelectField,
	TagsField,
	CoordsField,
	ActionButtons,
	SortButtons,
	EditFormHeader,
	EditFormActions,
	EditorHeader,
	EmptyState,
} from "./EditorComponents";
import type { ListEditorConfig, ListEditorField } from "./ListEditorTypes";

// 导出类型定义
export type { ListEditorConfig, ListEditorField } from "./ListEditorTypes";

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

	// 添加新项
	const handleAddItem = useCallback(() => {
		setEditingIndex(items.length);
		setEditForm(config.createEmpty());
		setTagsInput({});
	}, [items.length, config]);

	// 编辑项
	const handleEditItem = useCallback(
		(index: number) => {
			setEditingIndex(index);
			setEditForm(items[index] || config.createEmpty());
			setTagsInput({});
		},
		[items, config],
	);

	// 删除项
	const handleDeleteItem = useCallback(
		(index: number) => {
			onChange(items.filter((_, i) => i !== index));
			if (editingIndex === index) {
				setEditingIndex(null);
			}
		},
		[items, editingIndex, onChange],
	);

	// 保存编辑
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

	// 取消编辑
	const handleCancelEdit = useCallback(() => {
		setEditingIndex(null);
		setEditForm(config.createEmpty());
		setTagsInput({});
	}, [config]);

	// 上移
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

	// 下移
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

	// 字段值变更
	const handleFieldChange = useCallback(
		(fieldName: keyof T, value: unknown) => {
			setEditForm((prev) => ({ ...prev, [fieldName]: value }));
		},
		[],
	);

	// 添加标签
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

	// 移除标签
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

	// 获取显示值
	const getDisplayValue = (item: T): string => {
		const value = item[config.displayField];
		if (typeof value === "string") return value;
		return String(value || "");
	};

	// 获取次要显示值
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

	// 渲染字段
	const renderField = (field: ListEditorField<T>) => {
		const fieldKey = String(field.name);
		const isFullWidth = field.type === "textarea" || field.type === "tags";
		const className = isFullWidth ? "md:col-span-2" : "";

		switch (field.type) {
			case "text":
			case "url":
			case "date":
				return (
					<InputField
						key={fieldKey}
						label={field.label}
						value={(editForm[field.name] as string | undefined) || ""}
						onChange={(v) => handleFieldChange(field.name, v)}
						placeholder={field.placeholder}
						type={field.type === "url" ? "url" : field.type === "date" ? "date" : "text"}
						required={field.required}
						help={field.help}
						className={className}
					/>
				);
			case "textarea":
				return (
					<TextAreaField
						key={fieldKey}
						label={field.label}
						value={(editForm[field.name] as string | undefined) || ""}
						onChange={(v) => handleFieldChange(field.name, v)}
						placeholder={field.placeholder}
						required={field.required}
						help={field.help}
						className={className}
					/>
				);
			case "select":
				return (
					<SelectField
						key={fieldKey}
						label={field.label}
						value={(editForm[field.name] as string | undefined) || ""}
						onChange={(v) => handleFieldChange(field.name, v)}
						options={field.options || []}
						className={className}
					/>
				);
			case "tags":
				return (
					<TagsField
						key={fieldKey}
						label={field.label}
						tags={(editForm[field.name] as string[] | undefined) || []}
						onAdd={() => handleAddTag(field.name)}
						onRemove={(tag) => handleRemoveTag(field.name, tag)}
						inputValue={tagsInput[fieldKey] || ""}
						onInputChange={(v) => setTagsInput((prev) => ({ ...prev, [fieldKey]: v }))}
						placeholder={field.placeholder}
						className={className}
					/>
				);
			case "coords":
				return (
					<CoordsField
						key={fieldKey}
						value={
							(editForm[field.name] as { lat: number; lng: number } | undefined) ?? {}
						}
						onChange={(v) => {
							const coords =
								v.lat !== undefined && v.lng !== undefined ? { lat: v.lat, lng: v.lng } : undefined;
							handleFieldChange(field.name, coords);
						}}
						className={className}
					/>
				);
			default:
				return null;
		}
	};

	const isEditing = editingIndex !== null;
	const editMode = editingIndex === items.length ? "add" : "edit";
	const showSortButtons = config.enableManualSort ?? !config.sortField;

	return (
		<div className="space-y-4">
			<EditorHeader
				title={config.itemLabel}
				count={items.length}
				onAdd={handleAddItem}
			/>

			{/* 编辑表单 */}
			{isEditing && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<EditFormHeader mode={editMode} itemLabel={config.itemLabel} />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{config.fields.map(renderField)}
					</div>
					<EditFormActions
						onSave={handleSaveEdit}
						onCancel={handleCancelEdit}
						saveDisabled={config.fields
							.filter((f) => f.required)
							.some((f) => {
								const value = editForm[f.name];
								if (typeof value === "string") return !value.trim();
								return value === undefined || value === null;
							})}
					/>
				</div>
			)}

			{/* 列表 */}
			{items.length > 0 && !isEditing && (
				<div className="space-y-2">
					{items.map((item, index) => (
						<div
							key={String(item[config.idField] || index)}
							className="card-base p-3 flex items-center gap-3 group"
						>
							{showSortButtons && (
								<SortButtons
									onMoveUp={() => handleMoveUp(index)}
									onMoveDown={() => handleMoveDown(index)}
									canMoveUp={index > 0}
									canMoveDown={index < items.length - 1}
								/>
							)}

							<div className="flex-1 min-w-0">
								<div className="text-[var(--text-75)] font-medium truncate">
									{getDisplayValue(item)}
								</div>
								{getSecondaryValues(item).length > 0 && (
									<div className="text-[var(--text-50)] text-xs truncate mt-0.5">
										{getSecondaryValues(item).join(" · ")}
									</div>
								)}
								{config.renderItem && config.renderItem(item)}
							</div>

							<ActionButtons
								onEdit={() => handleEditItem(index)}
								onDelete={() => handleDeleteItem(index)}
							/>
						</div>
					))}
				</div>
			)}

			{/* 空状态 */}
			{items.length === 0 && !isEditing && (
				<EmptyState message={`暂无${config.itemLabel}，点击上方按钮添加`} />
			)}
		</div>
	);
}