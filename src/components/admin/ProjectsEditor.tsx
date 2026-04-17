/**
 * 项目可视化编辑器
 *
 * 用于 Projects 模板的项目列表可视化编辑
 */

import { useState } from "react";
import { SafeIcon } from "@/components/common/ui";
import type { Project } from "@/types";

interface ProjectsEditorProps {
	projects: Project[];
	onChange: (projects: Project[]) => void;
}

const emptyProject: Project = {
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

const statusOptions = [
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

export function ProjectsEditor({ projects, onChange }: ProjectsEditorProps) {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<Project>(emptyProject);
	const [techInput, setTechInput] = useState("");

	const handleAddProject = () => {
		setEditingIndex(projects.length);
		setEditForm(emptyProject);
		setTechInput("");
	};

	const handleEditProject = (index: number) => {
		setEditingIndex(index);
		setEditForm(projects[index] || emptyProject);
		setTechInput("");
	};

	const handleDeleteProject = (index: number) => {
		onChange(projects.filter((_, i) => i !== index));
		if (editingIndex === index) {
			setEditingIndex(null);
		}
	};

	const handleSaveEdit = () => {
		if (!editForm.name.trim()) return;

		const techArray = editForm.tech;

		const updatedProject: Project = {
			...editForm,
			tech: techArray,
		};

		if (editingIndex === projects.length) {
			onChange([...projects, updatedProject]);
		} else if (editingIndex !== null && projects[editingIndex]) {
			onChange(
				projects.map((p, i) => (i === editingIndex ? updatedProject : p)),
			);
		}

		setEditingIndex(null);
		setEditForm(emptyProject);
		setTechInput("");
	};

	const handleCancelEdit = () => {
		setEditingIndex(null);
		setEditForm(emptyProject);
		setTechInput("");
	};

	const handleAddTech = () => {
		if (techInput.trim() && !editForm.tech.includes(techInput.trim())) {
			setEditForm({ ...editForm, tech: [...editForm.tech, techInput.trim()] });
			setTechInput("");
		}
	};

	const handleRemoveTech = (tech: string) => {
		setEditForm({ ...editForm, tech: editForm.tech.filter((t) => t !== tech) });
	};

	const handleMoveUp = (index: number) => {
		if (index === 0) return;
		const newProjects = [...projects];
		const prev = newProjects[index - 1];
		const curr = newProjects[index];
		if (prev && curr) {
			newProjects[index - 1] = curr;
			newProjects[index] = prev;
			onChange(newProjects);
		}
	};

	const handleMoveDown = (index: number) => {
		if (index === projects.length - 1) return;
		const newProjects = [...projects];
		const curr = newProjects[index];
		const next = newProjects[index + 1];
		if (curr && next) {
			newProjects[index] = next;
			newProjects[index + 1] = curr;
			onChange(newProjects);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-75 font-medium">项目列表</h3>
				<button
					type="button"
					onClick={handleAddProject}
					className="btn-regular btn-sm py-1.5 px-3 flex items-center gap-1"
				>
					<SafeIcon icon="material-symbols:add-rounded" size={16} />
					添加项目
				</button>
			</div>

			{editingIndex !== null && (
				<div className="card-base p-4 space-y-3 border-2 border-[var(--primary)]">
					<h4 className="text-75 font-medium text-sm">
						{editingIndex === projects.length ? "添加新项目" : "编辑项目"}
					</h4>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label className="block text-50 text-xs mb-1">项目名称 *</label>
							<input
								type="text"
								value={editForm.name}
								onChange={(e) =>
									setEditForm({ ...editForm, name: e.target.value })
								}
								placeholder="我的项目"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">GitHub 仓库</label>
							<input
								type="text"
								value={editForm.githubRepo}
								onChange={(e) =>
									setEditForm({ ...editForm, githubRepo: e.target.value })
								}
								placeholder="owner/repo (自动解析 GitHub)"
								className="input-base"
							/>
							<p className="text-40 text-xs mt-0.5">
								格式: 用户名/仓库名，如 domye/blog
							</p>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">封面/头像</label>
							<input
								type="url"
								value={editForm.avatar}
								onChange={(e) =>
									setEditForm({ ...editForm, avatar: e.target.value })
								}
								placeholder="https://example.com/avatar.png"
								className="input-base"
							/>
						</div>

						<div>
							<label className="block text-50 text-xs mb-1">演示链接</label>
							<input
								type="url"
								value={editForm.demo}
								onChange={(e) =>
									setEditForm({ ...editForm, demo: e.target.value })
								}
								placeholder="https://demo.example.com"
								className="input-base"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-50 text-xs mb-1">描述</label>
							<input
								type="text"
								value={editForm.description}
								onChange={(e) =>
									setEditForm({ ...editForm, description: e.target.value })
								}
								placeholder="项目简介..."
								className="input-base"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-50 text-xs mb-1">技术栈</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={techInput}
									onChange={(e) => setTechInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddTech();
										}
									}}
									placeholder="输入技术名称后按 Enter"
									className="input-base flex-1"
								/>
								<button
									type="button"
									onClick={handleAddTech}
									className="btn-regular btn-sm px-2.5"
								>
									添加
								</button>
							</div>
							{editForm.tech.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									{editForm.tech.map((tech) => (
										<span
											key={tech}
											className="bg-[var(--primary)]/20 text-[var(--primary)] rounded-[var(--radius-small)] px-2 py-0.5 text-xs flex items-center gap-1"
										>
											{tech}
											<button
												type="button"
												onClick={() => handleRemoveTech(tech)}
												className="hover:bg-white/20 rounded"
											>
												<SafeIcon
													icon="material-symbols:close-rounded"
													size={12}
												/>
											</button>
										</span>
									))}
								</div>
							)}
						</div>

						<div className="md:col-span-2">
							<label className="block text-50 text-xs mb-1">状态</label>
							<div className="flex gap-2">
								{statusOptions.map((opt) => (
									<button
										key={opt.value}
										type="button"
										onClick={() =>
											setEditForm({
												...editForm,
												status: opt.value as "active" | "archived",
											})
										}
										className={`rounded-[var(--radius-medium)] py-1.5 px-3 text-sm flex items-center gap-1 transition-all ${
											editForm.status === opt.value
												? "btn-primary btn-sm py-1 px-2.5"
												: "btn-regular"
										}`}
									>
										<SafeIcon icon={opt.icon} size={14} />
										{opt.label}
									</button>
								))}
							</div>
						</div>
					</div>

					<div className="flex gap-2 pt-2">
						<button
							type="button"
							onClick={handleSaveEdit}
							disabled={!editForm.name.trim()}
							className="btn-primary btn-sm py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

			{projects.length > 0 && (
				<div className="space-y-2">
					{projects.map((project, index) => (
						<div
							key={index}
							className="card-base p-3 flex items-center gap-3 group"
						>
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
									disabled={index === projects.length - 1}
									className="p-1 hover:text-75 disabled:opacity-30 disabled:cursor-not-allowed"
									title="下移"
								>
									<SafeIcon
										icon="material-symbols:arrow-downward-rounded"
										size={16}
									/>
								</button>
							</div>

							{project.avatar && (
								<img
									src={project.avatar}
									alt={project.name}
									className="w-10 h-10 rounded-[var(--radius-small)] object-cover"
								/>
							)}

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-75 font-medium truncate">
										{project.name}
									</span>
									{project.githubRepo && (
										<SafeIcon
											icon="fa6-brands:github"
											size={14}
											className="text-50"
										/>
									)}
									{project.status === "archived" && (
										<span className="text-40 text-xs">已归档</span>
									)}
								</div>
								{project.tech.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-0.5">
										{project.tech.slice(0, 4).map((tech) => (
											<span
												key={tech}
												className="bg-[var(--bg-secondary)] text-50 rounded-[var(--radius-small)] px-1.5 py-0.5 text-xs"
											>
												{tech}
											</span>
										))}
									</div>
								)}
							</div>

							<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onClick={() => handleEditProject(index)}
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
									onClick={() => handleDeleteProject(index)}
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

			{projects.length === 0 && editingIndex === null && (
				<div className="card-base p-4 text-center text-50">
					<p>暂无项目，点击上方按钮添加</p>
				</div>
			)}
		</div>
	);
}
