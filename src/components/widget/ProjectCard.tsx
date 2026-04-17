/**
 * 项目卡片组件
 *
 * 可爱风格的 GitHub 仓库卡片，支持自动解析 GitHub 仓库信息
 */

import { SafeIcon } from "@/components/common/ui";
import { useGitHubRepo } from "@/hooks";
import type { Project } from "@/types";

interface ProjectCardProps {
	project: Project;
}

function truncateText(text: string, maxLength: number): string {
	if (!text) return "";
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength) + "...";
}

function GitHubRepoCard({ project }: ProjectCardProps) {
	const { data: repoInfo, isLoading } = useGitHubRepo(project.githubRepo);
	const avatar = project.avatar || project.cover;
	const githubUrl = repoInfo?.html_url || project.github;

	if (isLoading) {
		return (
			<div className="project-card project-card-loading">
				<div className="project-card-header">
					<div className="project-card-avatar-box">
						<div className="project-card-avatar-placeholder" />
					</div>
					<div className="project-card-info">
						<div className="project-card-name-loading" />
						<div className="project-card-tech-loading" />
					</div>
				</div>
				<div className="project-card-body">
					<p className="project-card-desc-loading">加载项目介绍中...</p>
				</div>
			</div>
		);
	}

	const desc = repoInfo?.description || project.description || "暂无描述";

	return (
		<a
			href={githubUrl || "#"}
			target="_blank"
			rel="noopener noreferrer"
			className="project-card project-card-link"
		>
			<div className="project-card-header">
				<div className="project-card-avatar-box">
					{avatar ? (
						<img
							src={avatar}
							alt={project.name}
							className="project-card-avatar"
						/>
					) : (
						<div className="project-card-avatar-default">
							<SafeIcon icon="fa6-brands:github" size={24} />
						</div>
					)}
				</div>
				<div className="project-card-info">
					<h3 className="project-card-name">{project.name}</h3>
					{project.tech.length > 0 && (
						<div className="project-card-tech-inline">
							{project.tech.slice(0, 4).map((t) => (
								<span key={t} className="project-card-tech-tag">
									{t}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
			<div className="project-card-body">
				<p className="project-card-desc">{truncateText(desc, 50)}</p>
			</div>
			{project.demo && (
				<div className="project-card-demo-badge">
					<SafeIcon
						icon="material-symbols:open-in-new-outline-rounded"
						size={14}
					/>
					演示
				</div>
			)}
			{project.status === "archived" && (
				<div className="project-card-archived">
					<SafeIcon icon="material-symbols:archive-outline-rounded" size={14} />
					已归档
				</div>
			)}
		</a>
	);
}

function ManualProjectCard({ project }: ProjectCardProps) {
	const avatar = project.avatar || project.cover;
	const linkUrl = project.demo || project.github;

	return (
		<a
			href={linkUrl || "#"}
			target="_blank"
			rel="noopener noreferrer"
			className="project-card project-card-link"
		>
			<div className="project-card-header">
				<div className="project-card-avatar-box">
					{avatar ? (
						<img
							src={avatar}
							alt={project.name}
							className="project-card-avatar"
						/>
					) : (
						<div className="project-card-avatar-default">
							<SafeIcon
								icon="material-symbols:folder-outline-rounded"
								size={24}
							/>
						</div>
					)}
				</div>
				<div className="project-card-info">
					<h3 className="project-card-name">{project.name}</h3>
					{project.tech.length > 0 && (
						<div className="project-card-tech-inline">
							{project.tech.slice(0, 4).map((t) => (
								<span key={t} className="project-card-tech-tag">
									{t}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
			<div className="project-card-body">
				<p className="project-card-desc">
					{truncateText(project.description, 50)}
				</p>
			</div>
			{project.demo && (
				<div className="project-card-demo-badge">
					<SafeIcon
						icon="material-symbols:open-in-new-outline-rounded"
						size={14}
					/>
					演示
				</div>
			)}
			{project.status === "archived" && (
				<div className="project-card-archived">
					<SafeIcon icon="material-symbols:archive-outline-rounded" size={14} />
					已归档
				</div>
			)}
		</a>
	);
}

export function ProjectCard({ project }: ProjectCardProps) {
	if (project.githubRepo) {
		return <GitHubRepoCard project={project} />;
	}
	return <ManualProjectCard project={project} />;
}
