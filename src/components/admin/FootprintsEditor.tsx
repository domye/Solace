/**
 * 足迹编辑器
 *
 * 用于 Footprints 模板的城市足迹可视化编辑，支持按省份分组折叠
 */

import { useState, useMemo } from "react";
import { SafeIcon } from "@/components/common/ui";
import type { FootprintCity } from "@/types";

interface ProvinceGroup {
	province: string;
	cities: FootprintCity[];
}

interface FootprintsEditorProps {
	cities: FootprintCity[];
	onChange: (cities: FootprintCity[]) => void;
}

const emptyCity: FootprintCity = {
	name: "",
	country: "",
};

export function FootprintsEditor({ cities, onChange }: FootprintsEditorProps) {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<FootprintCity>(emptyCity);
	// expandedGroups 存储已展开的省份，默认空（全部关闭）
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
	const [showAddForm, setShowAddForm] = useState(false);

	// 按省份分组
	const groupedCities = useMemo(() => {
		const groups: Map<string, ProvinceGroup> = new Map();

		cities.forEach((city) => {
			const province = city.province || city.country || "未分类";
			if (!groups.has(province)) {
				groups.set(province, { province, cities: [] });
			}
			groups.get(province)!.cities.push(city);
		});

		return Array.from(groups.values()).sort((a, b) =>
			a.province.localeCompare(b.province),
		);
	}, [cities]);

	// 切换展开状态
	const toggleGroup = (province: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(province)) {
				newSet.delete(province);
			} else {
				newSet.add(province);
			}
			return newSet;
		});
	};

	// 判断是否展开
	const isExpanded = (province: string): boolean =>
		expandedGroups.has(province);

	// 获取城市在原数组中的索引
	const getCityIndex = (city: FootprintCity): number => {
		return cities.findIndex(
			(c) => c.name === city.name && c.province === city.province,
		);
	};

	// 编辑城市
	const handleEditCity = (city: FootprintCity) => {
		const index = getCityIndex(city);
		if (index !== -1) {
			setEditingIndex(index);
			setEditForm(city);
			setShowAddForm(false);
		}
	};

	// 删除城市
	const handleDeleteCity = (city: FootprintCity) => {
		const index = getCityIndex(city);
		if (index !== -1) {
			onChange(cities.filter((_, i) => i !== index));
		}
	};

	// 保存编辑
	const handleSaveEdit = () => {
		if (!editForm.name.trim() || !editForm.country.trim()) return;

		if (showAddForm) {
			onChange([...cities, editForm]);
		} else if (editingIndex !== null) {
			onChange(cities.map((c, i) => (i === editingIndex ? editForm : c)));
		}

		setEditingIndex(null);
		setEditForm(emptyCity);
		setShowAddForm(false);
	};

	// 取消编辑
	const handleCancelEdit = () => {
		setEditingIndex(null);
		setEditForm(emptyCity);
		setShowAddForm(false);
	};

	// 添加新城市
	const handleAddCity = () => {
		setShowAddForm(true);
		setEditingIndex(null);
		setEditForm(emptyCity);
	};

	// 更新字段
	const updateField = (field: keyof FootprintCity, value: unknown) => {
		setEditForm((prev) => ({ ...prev, [field]: value }));
	};

	// 计算每个分组的城市数量
	const getGroupCount = (group: ProvinceGroup): number => group.cities.length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-75 font-medium">城市足迹 ({cities.length})</h3>
				<button
					type="button"
					onClick={handleAddCity}
					className="btn-regular btn-sm py-1.5 px-3 flex items-center gap-1"
				>
					<SafeIcon icon="material-symbols:add-rounded" size={16} />
					添加城市
				</button>
			</div>

			{/* 编辑/添加表单 */}
			{(editingIndex !== null || showAddForm) && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<h4 className="text-75 font-medium text-sm">
						{showAddForm ? "添加新城市" : "编辑城市"}
					</h4>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label className="block text-50 text-xs mb-1">
								城市名称 <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={editForm.name}
								onChange={(e) => updateField("name", e.target.value)}
								placeholder="北京"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">
								国家 <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={editForm.country}
								onChange={(e) => updateField("country", e.target.value)}
								placeholder="中国"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">省份/地区</label>
							<input
								type="text"
								value={editForm.province || ""}
								onChange={(e) => updateField("province", e.target.value)}
								placeholder="北京市"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">访问日期</label>
							<input
								type="date"
								value={editForm.visited_at || ""}
								onChange={(e) => updateField("visited_at", e.target.value)}
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">停留时长</label>
							<input
								type="text"
								value={editForm.duration || ""}
								onChange={(e) => updateField("duration", e.target.value)}
								placeholder="3天"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">坐标</label>
							<div className="flex gap-2">
								<input
									type="number"
									step="any"
									value={editForm.coords?.lat || ""}
									onChange={(e) =>
										updateField("coords", {
											...(editForm.coords || {}),
											lat: Number(e.target.value),
										})
									}
									placeholder="纬度"
									className="input-base flex-1"
								/>
								<input
									type="number"
									step="any"
									value={editForm.coords?.lng || ""}
									onChange={(e) =>
										updateField("coords", {
											...(editForm.coords || {}),
											lng: Number(e.target.value),
										})
									}
									placeholder="经度"
									className="input-base flex-1"
								/>
							</div>
						</div>

						<div className="md:col-span-2">
							<label className="block text-50 text-xs mb-1">备注</label>
							<textarea
								value={editForm.notes || ""}
								onChange={(e) => updateField("notes", e.target.value)}
								placeholder="旅行感想..."
								rows={2}
								className="input-base"
							/>
						</div>
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

			{/* 分组显示 */}
			{groupedCities.length > 0 && editingIndex === null && !showAddForm && (
				<div className="space-y-2">
					{groupedCities.map((group) => (
						<div key={group.province} className="card-base">
							{/* 分组标题 */}
							<button
								type="button"
								onClick={() => toggleGroup(group.province)}
								className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--btn-regular-bg-hover)] transition-colors rounded-[var(--radius-medium)]"
							>
								<div className="flex items-center gap-2">
									<SafeIcon
										icon={
											isExpanded(group.province)
												? "material-symbols:expand-more-rounded"
												: "material-symbols:chevron-right-rounded"
										}
										size={20}
										className="text-50"
									/>
									<span className="text-75 font-medium">{group.province}</span>
									<span className="text-50 text-xs">
										({getGroupCount(group)})
									</span>
								</div>
							</button>

							{/* 城市列表 */}
							{isExpanded(group.province) && (
								<div className="px-3 pb-3 space-y-1">
									{group.cities.map((city) => (
										<div
											key={city.name}
											className="flex items-center gap-3 py-2 px-2 rounded-[var(--radius-small)] hover:bg-[var(--bg-secondary)] group"
										>
											<div className="flex-1 min-w-0">
												<div className="text-75 truncate">{city.name}</div>
												{city.visited_at && (
													<div className="text-50 text-xs">
														{city.visited_at}
													</div>
												)}
											</div>

											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													type="button"
													onClick={() => handleEditCity(city)}
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
													onClick={() => handleDeleteCity(city)}
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
						</div>
					))}
				</div>
			)}

			{/* 无数据提示 */}
			{cities.length === 0 && !showAddForm && (
				<div className="card-base p-4 text-center text-50">
					<p>暂无城市足迹，点击上方按钮添加</p>
				</div>
			)}
		</div>
	);
}
