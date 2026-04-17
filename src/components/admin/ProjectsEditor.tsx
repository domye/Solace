/**
 * 项目可视化编辑器
 *
 * 用于 Projects 模板的项目列表可视化编辑
 */
import { useState, useCallback } from "react";
import { SafeIcon } from "@/components/common/ui";
import {
	InputField,
	TagsField,
	SelectField,
	ActionButtons,
	SortButtons,
	EditFormHeader,
	EditFormActions,
	EditorHeader,
	EmptyState,
} from "./EditorComponents";
import type { Project } from "@/types";

// ============ 常量 ============

const EMPTY_PROJECT: Project = {
	name: "",
	description: "",
	tech: [],
	github: "",
	githubRepo: "",
	demo: "",
	cover: "",
	avatar: "",
	status: "active",
};

const STATUS_OPTIONS = [
	{
		value: "active",
		label: "进行中",
		icon: "material-symbols:rocket-launch-outline-rounded",
	},
	{
		value: "archived",
		label: "已归档",
		icon: "material-symbols:archive-outline-rounded",
	},
];

// ============ 子组件 ============

/** 项目列表项 */
function ProjectItem({
	project,
	index,
	total,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
}: {
	project: Project;
	index: number;
	total: number;
	onEdit: () => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
}) {
	return (
		<div className="card-base p-3 flex items-center gap-3 group">
			<SortButtons
				onMoveUp={onMoveUp}
				onMoveDown={onMoveDown}
				canMoveUp={index > 0}
				canMoveDown={index < total - 1}
			/>

			{project.avatar && (
				<img
					src={project.avatar}
					alt={project.name}
					className="w-10 h-10 rounded-[var(--radius-small)] object-cover"
				/>
			)}

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-[var(--text-75)] font-medium truncate">
						{project.name}
					</span>
					{project.githubRepo && (
						<SafeIcon icon="fa6-brands:github" size={14} className="text-[var(--text-50)]" />
					)}
					{project.status === "archived" && (
						<span className="text-[var(--text-40)] text-xs">已归档</span>
					)}
				</div>
				{project.tech.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-0.5">
						{project.tech.slice(0, 4).map((tech) => (
							<span
								key={tech}
								className="bg-[var(--bg-secondary)] text-[var(--text-50)] rounded-[var(--radius-small)] px-1.5 py-0.5 text-xs"
							>
								{tech}
							</span>
						))}
					</div>
				)}
			</div>

			<ActionButtons onEdit={onEdit} onDelete={onDelete} />
		</div>
	);
}

// ============ 主组件 ============

interface ProjectsEditorProps {
	projects: Project[];
	onChange: (projects: Project[]) => void;
}

export function ProjectsEditor({ projects, onChange }: ProjectsEditorProps) {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<Project>(EMPTY_PROJECT);
	const [techInput, setTechInput] = useState("");

	// 添加项目
	const handleAddProject = useCallback(() => {
		setEditingIndex(projects.length);
		setEditForm(EMPTY_PROJECT);
		setTechInput("");
	}, [projects.length]);

	// 编辑项目
	const handleEditProject = useCallback(
		(index: number) => {
			setEditingIndex(index);
			setEditForm(projects[index] || EMPTY_PROJECT);
			setTechInput("");
		},
		[projects],
	);

	// 删除项目
	const handleDeleteProject = useCallback(
		(index: number) => {
			onChange(projects.filter((_, i) => i !== index));
			if (editingIndex === index) {
				setEditingIndex(null);
			}
		},
		[projects, editingIndex, onChange],
	);

	// 保存
	const handleSaveEdit = useCallback(() => {
		if (!editForm.name.trim()) return;

		if (editingIndex === projects.length) {
			onChange([...projects, editForm]);
		} else if (editingIndex !== null && projects[editingIndex]) {
			onChange(projects.map((p, i) => (i === editingIndex ? editForm : p)));
		}

		setEditingIndex(null);
		setEditForm(EMPTY_PROJECT);
		setTechInput("");
	}, [editForm, editingIndex, projects, onChange]);

	// 取消
	const handleCancelEdit = useCallback(() => {
		setEditingIndex(null);
		setEditForm(EMPTY_PROJECT);
		setTechInput("");
	}, []);

	// 添加技术标签
	const handleAddTech = useCallback(
		(tag: string) => {
			const trimmed = tag.trim();
			if (trimmed && !editForm.tech.includes(trimmed)) {
				setEditForm({ ...editForm, tech: [...editForm.tech, trimmed] });
				setTechInput("");
			}
		},
		[editForm],
	);

	// 移除技术标签
	const handleRemoveTech = useCallback(
		(tech: string) => {
			setEditForm({ ...editForm, tech: editForm.tech.filter((t) => t !== tech) });
		},
		[editForm],
	);

	// 上移
	const handleMoveUp = useCallback(
		(index: number) => {
			if (index === 0) return;
			const newProjects = [...projects];
			const prev = newProjects[index - 1];
			const curr = newProjects[index];
			if (prev && curr) {
				newProjects[index - 1] = curr;
				newProjects[index] = prev;
				onChange(newProjects);
			}
		},
		[projects, onChange],
	);

	// 下移
	const handleMoveDown = useCallback(
		(index: number) => {
			if (index === projects.length - 1) return;
			const newProjects = [...projects];
			const curr = newProjects[index];
			const next = newProjects[index + 1];
			if (curr && next) {
				newProjects[index] = next;
				newProjects[index + 1] = curr;
				onChange(newProjects);
			}
		},
		[projects, onChange],
	);

	// 更新字段
	const updateField = useCallback(
		(field: keyof Project, value: Project[keyof Project]) => {
			setEditForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const isEditing = editingIndex !== null;
	const editMode = editingIndex === projects.length ? "add" : "edit";

	return (
		<div className="space-y-4">
			<EditorHeader
				title="项目列表"
				count={projects.length}
				onAdd={handleAddProject}
			/>

			{/* 编辑表单 */}
			{isEditing && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<EditFormHeader mode={editMode} itemLabel="项目" />

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<InputField
							label="项目名称"
							value={editForm.name}
							onChange={(v) => updateField("name", v)}
							placeholder="我的项目"
							required
						/>

						<InputField
							label="GitHub 仓库"
							value={editForm.githubRepo ?? ""}
							onChange={(v) => updateField("githubRepo", v)}
							placeholder="owner/repo (自动解析 GitHub)"
							help="格式: 用户名/仓库名，如 domye/blog"
						/>

						<InputField
							label="封面/头像"
							value={editForm.avatar ?? ""}
							onChange={(v) => updateField("avatar", v)}
							placeholder="https://example.com/avatar.png"
							type="url"
						/>

						<InputField
							label="演示链接"
							value={editForm.demo ?? ""}
							onChange={(v) => updateField("demo", v)}
							placeholder="https://demo.example.com"
							type="url"
						/>

						<InputField
							label="描述"
							value={editForm.description}
							onChange={(v) => updateField("description", v)}
							placeholder="项目简介..."
							className="md:col-span-2"
						/>

						<TagsField
							label="技术栈"
							tags={editForm.tech}
							onAdd={handleAddTech}
							onRemove={handleRemoveTech}
							inputValue={techInput}
							onInputChange={setTechInput}
							placeholder="输入技术名称后按 Enter"
							className="md:col-span-2"
						/>

						<SelectField
							label="状态"
							value={editForm.status}
							onChange={(v) => updateField("status", v as Project["status"])}
							options={STATUS_OPTIONS}
							className="md:col-span-2"
						/>
					</div>

					<EditFormActions
						onSave={handleSaveEdit}
						onCancel={handleCancelEdit}
						saveDisabled={!editForm.name.trim()}
					/>
				</div>
			)}

			{/* 项目列表 */}
			{projects.length > 0 && !isEditing && (
				<div className="space-y-2">
					{projects.map((project, index) => (
						<ProjectItem
							key={index}
							project={project}
							index={index}
							total={projects.length}
							onEdit={() => handleEditProject(index)}
							onDelete={() => handleDeleteProject(index)}
							onMoveUp={() => handleMoveUp(index)}
							onMoveDown={() => handleMoveDown(index)}
						/>
					))}
				</div>
			)}

			{/* 空状态 */}
			{projects.length === 0 && !isEditing && (
				<EmptyState message="暂无项目，点击上方按钮添加" />
			)}
		</div>
	);
}