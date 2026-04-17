/**
 * 足迹编辑器
 *
 * 用于 Footprints 模板的城市足迹可视化编辑，支持按省份分组折叠
 */
import { useState, useMemo, useCallback } from "react";
import { SafeIcon } from "@/components/common/ui";
import {
	InputField,
	TextAreaField,
	CoordsField,
	ActionButtons,
	EditFormHeader,
	EditFormActions,
	EditorHeader,
	EmptyState,
} from "./EditorComponents";
import type { FootprintCity } from "@/types";

// ============ 类型定义 ============

interface ProvinceGroup {
	province: string;
	cities: Array<{ city: FootprintCity; index: number }>;
}

interface FootprintsEditorProps {
	cities: FootprintCity[];
	onChange: (cities: FootprintCity[]) => void;
}

interface EditState {
	mode: "add" | "edit" | null;
	index: number | null;
	form: FootprintCity;
}

// ============ 常量 ============

const EMPTY_CITY: FootprintCity = { name: "", country: "" };

// ============ 子组件 ============

/** 城市列表项 */
function CityItem({
	city,
	onEdit,
	onDelete,
}: {
	city: FootprintCity;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex items-center gap-3 py-2 px-2 rounded-[var(--radius-small)] hover:bg-[var(--bg-secondary)] group">
			<div className="flex-1 min-w-0">
				<div className="text-[var(--text-75)] truncate">{city.name}</div>
				{city.visited_at && (
					<div className="text-[var(--text-50)] text-xs">{city.visited_at}</div>
				)}
			</div>
			<ActionButtons onEdit={onEdit} onDelete={onDelete} />
		</div>
	);
}

/** 省份分组标题 */
function GroupHeader({
	province,
	count,
	isExpanded,
	onToggle,
}: {
	province: string;
	count: number;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--btn-regular-bg-hover)] transition-colors rounded-[var(--radius-medium)]"
		>
			<div className="flex items-center gap-2">
				<SafeIcon
					icon={
						isExpanded
							? "material-symbols:expand-more-rounded"
							: "material-symbols:chevron-right-rounded"
					}
					size={20}
					className="text-[var(--text-50)]"
				/>
				<span className="text-[var(--text-75)] font-medium">{province}</span>
				<span className="text-[var(--text-50)] text-xs">({count})</span>
			</div>
		</button>
	);
}

// ============ 主组件 ============

export function FootprintsEditor({ cities, onChange }: FootprintsEditorProps) {
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
	const [editState, setEditState] = useState<EditState>({
		mode: null,
		index: null,
		form: EMPTY_CITY,
	});

	// 按省份分组（保留原始索引）
	const groupedCities = useMemo<ProvinceGroup[]>(() => {
		const groups = new Map<string, ProvinceGroup>();

		cities.forEach((city, index) => {
			const province = city.province || city.country || "未分类";
			if (!groups.has(province)) {
				groups.set(province, { province, cities: [] });
			}
			groups.get(province)!.cities.push({ city, index });
		});

		return Array.from(groups.values()).sort((a, b) =>
			a.province.localeCompare(b.province),
		);
	}, [cities]);

	// 切换分组展开
	const toggleGroup = useCallback((province: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(province)) {
				next.delete(province);
			} else {
				next.add(province);
			}
			return next;
		});
	}, []);

	// 更新表单字段
	const updateForm = useCallback(
		(field: keyof FootprintCity, value: FootprintCity[keyof FootprintCity]) => {
			setEditState((prev) => ({
				...prev,
				form: { ...prev.form, [field]: value },
			}));
		},
		[],
	);

	// 开始添加
	const startAdd = useCallback(() => {
		setEditState({ mode: "add", index: null, form: EMPTY_CITY });
	}, []);

	// 开始编辑
	const startEdit = useCallback((index: number, city: FootprintCity) => {
		setEditState({ mode: "edit", index, form: city });
	}, []);

	// 取消编辑
	const cancelEdit = useCallback(() => {
		setEditState({ mode: null, index: null, form: EMPTY_CITY });
	}, []);

	// 保存
	const saveEdit = useCallback(() => {
		const { mode, index, form } = editState;
		if (!form.name.trim() || !form.country.trim()) return;

		if (mode === "add") {
			onChange([...cities, form]);
		} else if (mode === "edit" && index !== null) {
			onChange(cities.map((c, i) => (i === index ? form : c)));
		}

		cancelEdit();
	}, [editState, cities, onChange, cancelEdit]);

	// 删除
	const deleteCity = useCallback(
		(index: number) => {
			onChange(cities.filter((_, i) => i !== index));
		},
		[cities, onChange],
	);

	const { mode: editMode, form } = editState;
	const isEditing = editMode !== null;

	return (
		<div className="space-y-4">
			<EditorHeader title="城市足迹" count={cities.length} onAdd={startAdd} />

			{/* 编辑表单 */}
			{isEditing && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<EditFormHeader mode={editMode!} itemLabel="城市" />

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<InputField
							label="城市名称"
							value={form.name}
							onChange={(v) => updateForm("name", v)}
							placeholder="北京"
							required
						/>
						<InputField
							label="国家"
							value={form.country}
							onChange={(v) => updateForm("country", v)}
							placeholder="中国"
							required
						/>
						<InputField
							label="省份/地区"
							value={form.province ?? ""}
							onChange={(v) => updateForm("province", v)}
							placeholder="北京市"
						/>
						<InputField
							label="访问日期"
							value={form.visited_at ?? ""}
							onChange={(v) => updateForm("visited_at", v)}
							type="date"
						/>
						<InputField
							label="停留时长"
							value={form.duration ?? ""}
							onChange={(v) => updateForm("duration", v)}
							placeholder="3天"
						/>
						<CoordsField
							value={form.coords ?? {}}
							onChange={(v) => {
								const coords =
									v.lat !== undefined && v.lng !== undefined
										? { lat: v.lat, lng: v.lng }
										: undefined;
								updateForm("coords", coords);
							}}
						/>
						<TextAreaField
							label="备注"
							value={form.notes ?? ""}
							onChange={(v) => updateForm("notes", v)}
							placeholder="旅行感想..."
							className="md:col-span-2"
						/>
					</div>

					<EditFormActions
						onSave={saveEdit}
						onCancel={cancelEdit}
						saveDisabled={!form.name.trim() || !form.country.trim()}
					/>
				</div>
			)}

			{/* 分组列表 */}
			{groupedCities.length > 0 && !isEditing && (
				<div className="space-y-2">
					{groupedCities.map((group) => {
						const isExpanded = expandedGroups.has(group.province);
						return (
							<div key={group.province} className="card-base">
								<GroupHeader
									province={group.province}
									count={group.cities.length}
									isExpanded={isExpanded}
									onToggle={() => toggleGroup(group.province)}
								/>

								{isExpanded && (
									<div className="px-3 pb-3 space-y-1">
										{group.cities.map(({ city, index }) => (
											<CityItem
												key={index}
												city={city}
												onEdit={() => startEdit(index, city)}
												onDelete={() => deleteCity(index)}
											/>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* 空状态 */}
			{cities.length === 0 && !isEditing && (
				<EmptyState message="暂无城市足迹，点击上方按钮添加" />
			)}
		</div>
	);
}