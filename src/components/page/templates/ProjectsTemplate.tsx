/**
 * 项目展示模板
 *
 * 用于 template 类型为 "projects" 的页面
 */

import { MarkdownRenderer, SafeIcon } from "@/components";
import { ProjectCard } from "@/components/widget/ProjectCard";
import type { ProjectsFrontmatter } from "@/types";

interface ProjectsTemplateProps {
	frontmatter: ProjectsFrontmatter;
	markdown: string;
}

export function ProjectsTemplate({
	frontmatter,
	markdown,
}: ProjectsTemplateProps) {
	// 按状态分组
	const activeProjects =
		frontmatter.projects?.filter((p) => p.status === "active") || [];
	const archivedProjects =
		frontmatter.projects?.filter((p) => p.status === "archived") || [];

	return (
		<div className="space-y-6 fade-in-up">
			{/* 简介区域 */}
			{markdown && (
				<div className="card-base p-6 md:p-8">
					<MarkdownRenderer content={markdown} />
				</div>
			)}

			{/* 活跃项目 */}
			{activeProjects.length > 0 && (
				<div className="card-base p-6 md:p-8">
					<h2 className="text-90 text-xl font-bold mb-6 flex items-center gap-2">
						<SafeIcon icon="material-symbols:rocket-launch-outline-rounded" />
						进行中的项目
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{activeProjects.map((project) => (
							<ProjectCard key={project.name} project={project} />
						))}
					</div>
				</div>
			)}

			{/* 已归档项目 */}
			{archivedProjects.length > 0 && (
				<div className="card-base p-6 md:p-8">
					<h2 className="text-90 text-xl font-bold mb-6 flex items-center gap-2 text-50">
						<SafeIcon icon="material-symbols:archive-outline-rounded" />
						历史项目
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
						{archivedProjects.map((project) => (
							<ProjectCard key={project.name} project={project} />
						))}
					</div>
				</div>
			)}

			{/* 无项目时显示 */}
			{!frontmatter.projects?.length && !markdown && (
				<div className="card-base p-6 md:p-8 text-center text-50">暂无项目</div>
			)}
		</div>
	);
}
