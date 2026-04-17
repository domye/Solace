/**
 * 页面编辑器
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePage, useCreatePage, useUpdatePage } from "@/hooks";
import {
	PageHeader,
	LoadingButton,
	InputField,
	TextAreaField,
} from "@/components";
import {
	ProjectsEditor,
	TimelineEditor,
	FootprintsEditor,
} from "@/components/admin";
import { request_CreatePageRequest } from "@/api";
import { parseFrontmatter, stringifyFrontmatter } from "@/utils/frontmatter";
import type {
	Project,
	TimelineEvent,
	FootprintCity,
	ProjectsFrontmatter,
	AboutFrontmatter,
	FootprintsFrontmatter,
} from "@/types";

type PageTemplate = request_CreatePageRequest.template;
type PageStatus = request_CreatePageRequest.status;

const templateOptions: {
	value: PageTemplate;
	label: string;
	description: string;
}[] = [
	{
		value: request_CreatePageRequest.template.DEFAULT,
		label: "默认",
		description: "普通 Markdown 页面",
	},
	{
		value: request_CreatePageRequest.template.ABOUT,
		label: "关于我",
		description: "时间线 + 个人介绍",
	},
	{
		value: request_CreatePageRequest.template.PROJECTS,
		label: "项目展示",
		description: "项目卡片列表",
	},
	{
		value: request_CreatePageRequest.template.FOOTPRINTS,
		label: "我的足迹",
		description: "地图 + 城市足迹列表",
	},
];

const templateExamples: Record<PageTemplate, string> = {
	[request_CreatePageRequest.template.DEFAULT]: "",
	[request_CreatePageRequest.template.ABOUT]: `---
timeline:
  - date: "2024-03-15"
    title: "开始写博客"
    description: "搭建个人博客系统"
    type: "milestone"
  - date: "2023-09-01"
    title: "入职某公司"
    type: "work"
---

## 关于我

欢迎来到我的博客！`,
	[request_CreatePageRequest.template.PROJECTS]: `---
projects:
  - name: "个人博客"
    description: "基于 React + Go 的博客系统"
    tech: ["React", "Go", "PostgreSQL"]
    github: "https://github.com/..."
    status: "active"
  - name: "CLI工具"
    description: "命令行效率工具"
    tech: ["Rust"]
    status: "archived"
---

## 项目介绍

这里是我的开源项目。`,
	[request_CreatePageRequest.template.FOOTPRINTS]: `---
cities:
  - name: "北京"
    country: "中国"
    province: "北京市"
    visited_at: "2024-03-15"
    coords: { lat: 39.9042, lng: 116.4074 }
    highlights: ["故宫", "长城"]
    notes: "第一次去北京"
  - name: "上海"
    country: "中国"
    province: "上海市"
    visited_at: "2023-12-20"
    coords: { lat: 31.2304, lng: 121.4737 }
    highlights: ["外滩", "东方明珠"]
---

## 旅行记录

记录我去过的城市。`,
};

// 判断模板是否需要可视化编辑器
function isVisualTemplate(template: PageTemplate): boolean {
	return (
		template === request_CreatePageRequest.template.ABOUT ||
		template === request_CreatePageRequest.template.PROJECTS ||
		template === request_CreatePageRequest.template.FOOTPRINTS
	);
}

export function PageEditorPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);

	const { data: existingPage } = usePage(Number(id) || 0);
	const createMutation = useCreatePage();
	const updateMutation = useUpdatePage();

	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [template, setTemplate] = useState<PageTemplate>(
		request_CreatePageRequest.template.DEFAULT,
	);
	const [content, setContent] = useState("");
	const [summary, setSummary] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [status, setStatus] = useState<PageStatus>(
		request_CreatePageRequest.status.DRAFT,
	);
	const [order, setOrder] = useState(0);
	const [showInNav, setShowInNav] = useState(true);
	const [error, setError] = useState("");

	// 各模板专用 state
	const [projects, setProjects] = useState<Project[]>([]);
	const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
	const [cities, setCities] = useState<FootprintCity[]>([]);
	const [markdownContent, setMarkdownContent] = useState("");

	// 加载现有页面数据
	useEffect(() => {
		if (existingPage) {
			setTitle(existingPage.title);
			setSlug(existingPage.slug || "");
			setTemplate(existingPage.template as PageTemplate);
			setContent(existingPage.content);
			setSummary(existingPage.summary || "");
			setCoverImage(existingPage.cover_image || "");
			setStatus(existingPage.status as PageStatus);
			setOrder(existingPage.order);
			setShowInNav(existingPage.show_in_nav);

			// 解析对应模板的内容
			if (existingPage.template === "projects") {
				const parsed = parseFrontmatter<ProjectsFrontmatter>(
					existingPage.content,
				);
				setProjects(parsed.frontmatter.projects || []);
				setMarkdownContent(parsed.markdown);
			} else if (existingPage.template === "about") {
				const parsed = parseFrontmatter<AboutFrontmatter>(existingPage.content);
				setTimeline(parsed.frontmatter.timeline || []);
				setMarkdownContent(parsed.markdown);
			} else if (existingPage.template === "footprints") {
				const parsed = parseFrontmatter<FootprintsFrontmatter>(
					existingPage.content,
				);
				setCities(parsed.frontmatter.cities || []);
				setMarkdownContent(parsed.markdown);
			}
		}
	}, [existingPage]);

	// 同步 frontmatter 数据到 content
	const syncFrontmatter = (
		frontmatterData: Record<string, unknown>,
		markdown: string,
	) => {
		const yamlStr = stringifyFrontmatter(frontmatterData);
		setContent(yamlStr + markdown);
	};

	// Projects 数据变更
	const handleProjectsChange = (newProjects: Project[]) => {
		setProjects(newProjects);
		syncFrontmatter({ projects: newProjects }, markdownContent);
	};

	// Timeline 数据变更
	const handleTimelineChange = (newTimeline: TimelineEvent[]) => {
		setTimeline(newTimeline);
		syncFrontmatter({ timeline: newTimeline }, markdownContent);
	};

	// Cities 数据变更
	const handleCitiesChange = (newCities: FootprintCity[]) => {
		setCities(newCities);
		syncFrontmatter({ cities: newCities }, markdownContent);
	};

	// Markdown 内容变更
	const handleMarkdownChange = (newMarkdown: string) => {
		setMarkdownContent(newMarkdown);
		let frontmatterData: Record<string, unknown> = {};
		if (template === request_CreatePageRequest.template.PROJECTS) {
			frontmatterData = { projects };
		} else if (template === request_CreatePageRequest.template.ABOUT) {
			frontmatterData = { timeline };
		} else if (template === request_CreatePageRequest.template.FOOTPRINTS) {
			frontmatterData = { cities };
		}
		syncFrontmatter(frontmatterData, newMarkdown);
	};

	// 模板切换
	const handleTemplateChange = (newTemplate: PageTemplate) => {
		setTemplate(newTemplate);

		if (!isEdit && !content) {
			// 新建页面：插入示例内容
			setContent(templateExamples[newTemplate]);

			if (newTemplate === request_CreatePageRequest.template.PROJECTS) {
				const parsed = parseFrontmatter<ProjectsFrontmatter>(
					templateExamples[newTemplate],
				);
				setProjects(parsed.frontmatter.projects || []);
				setMarkdownContent(parsed.markdown);
			} else if (newTemplate === request_CreatePageRequest.template.ABOUT) {
				const parsed = parseFrontmatter<AboutFrontmatter>(
					templateExamples[newTemplate],
				);
				setTimeline(parsed.frontmatter.timeline || []);
				setMarkdownContent(parsed.markdown);
			} else if (
				newTemplate === request_CreatePageRequest.template.FOOTPRINTS
			) {
				const parsed = parseFrontmatter<FootprintsFrontmatter>(
					templateExamples[newTemplate],
				);
				setCities(parsed.frontmatter.cities || []);
				setMarkdownContent(parsed.markdown);
			}
		} else if (isVisualTemplate(newTemplate)) {
			// 切换到可视化模板：解析现有内容
			if (newTemplate === request_CreatePageRequest.template.PROJECTS) {
				const parsed = parseFrontmatter<ProjectsFrontmatter>(content);
				setProjects(parsed.frontmatter.projects || []);
				setMarkdownContent(parsed.markdown);
			} else if (newTemplate === request_CreatePageRequest.template.ABOUT) {
				const parsed = parseFrontmatter<AboutFrontmatter>(content);
				setTimeline(parsed.frontmatter.timeline || []);
				setMarkdownContent(parsed.markdown);
			} else if (
				newTemplate === request_CreatePageRequest.template.FOOTPRINTS
			) {
				const parsed = parseFrontmatter<FootprintsFrontmatter>(content);
				setCities(parsed.frontmatter.cities || []);
				setMarkdownContent(parsed.markdown);
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!title.trim()) {
			setError("标题不能为空");
			return;
		}

		try {
			const pageData = {
				title,
				slug: slug.trim() || undefined,
				template,
				content,
				summary,
				cover_image: coverImage || undefined,
				status,
				order,
				show_in_nav: showInNav,
			};

			if (isEdit && id) {
				await updateMutation.mutateAsync({
					id: Number(id),
					data: {
						...pageData,
						version: existingPage?.version || 1,
					},
				});
				navigate("/admin/pages");
			} else {
				await createMutation.mutateAsync(pageData);
				navigate("/admin/pages");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存失败");
		}
	};

	// 渲染可视化编辑器
	const renderVisualEditor = () => {
		if (template === request_CreatePageRequest.template.PROJECTS) {
			return (
				<ProjectsEditor projects={projects} onChange={handleProjectsChange} />
			);
		}
		if (template === request_CreatePageRequest.template.ABOUT) {
			return (
				<TimelineEditor timeline={timeline} onChange={handleTimelineChange} />
			);
		}
		if (template === request_CreatePageRequest.template.FOOTPRINTS) {
			return <FootprintsEditor cities={cities} onChange={handleCitiesChange} />;
		}
		return null;
	};

	return (
		<div className="space-y-4">
			<PageHeader
				title={isEdit ? "编辑页面" : "新建页面"}
				icon={
					isEdit
						? "material-symbols:edit-outline-rounded"
						: "material-symbols:add-rounded"
				}
			/>

			<form
				onSubmit={handleSubmit}
				className="card-base p-6 fade-in-up"
				style={{ animationDelay: "0.1s" }}
			>
				{error && (
					<div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
						{error}
					</div>
				)}

				<InputField
					label="标题"
					value={title}
					onChange={setTitle}
					placeholder="页面标题"
					required
				/>

				<div className="mb-4">
					<label className="block text-75 text-sm font-medium mb-2">
						Slug{" "}
						<span className="text-50 text-xs ml-1">(留空自动从标题生成)</span>
					</label>
					<input
						type="text"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="例如: about"
						className="input-base"
					/>
					<p className="text-50 text-xs mt-1">
						用于页面 URL，访问地址为 /pages/{slug || "..."}
					</p>
				</div>

				<div className="mb-4">
					<label className="block text-75 text-sm font-medium mb-2">
						页面模板
					</label>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{templateOptions.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => handleTemplateChange(opt.value)}
								className={`btn-regular btn-sm p-2 text-left ${
									template === opt.value
										? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
										: ""
								}`}
							>
								<div className="font-medium">{opt.label}</div>
								<div className="text-xs text-50">{opt.description}</div>
							</button>
						))}
					</div>
				</div>

				<InputField
					label="封面图片"
					value={coverImage}
					onChange={setCoverImage}
					placeholder="https://example.com/cover.jpg"
					type="url"
				/>

				<TextAreaField
					label="摘要"
					value={summary}
					onChange={setSummary}
					placeholder="页面简要摘要"
					rows={2}
				/>

				<div className="mb-4">
					<label className="block text-75 text-sm font-medium mb-2">
						内容{" "}
						<span className="text-50 text-xs ml-1">
							(Markdown + YAML frontmatter)
						</span>
					</label>

					{isVisualTemplate(template) && (
						<div className="mb-4">{renderVisualEditor()}</div>
					)}

					<textarea
						value={isVisualTemplate(template) ? markdownContent : content}
						onChange={(e) => {
							if (isVisualTemplate(template)) {
								handleMarkdownChange(e.target.value);
							} else {
								setContent(e.target.value);
							}
						}}
						placeholder={
							isVisualTemplate(template)
								? "在这里撰写页面正文（Markdown）..."
								: "在这里撰写页面内容..."
						}
						rows={isVisualTemplate(template) ? 8 : 20}
						className="input-base font-mono text-sm"
						required={!isVisualTemplate(template)}
					/>
					<p className="text-50 text-xs mt-1">
						{isVisualTemplate(template)
							? "结构化数据已在上方的可视化编辑器中填写，此处仅编辑正文内容。"
							: template !== "default"
								? "根据模板类型，在 YAML frontmatter 中填写结构化数据（--- 包围的部分）。"
								: ""}
						正文使用 Markdown 格式。
					</p>
				</div>

				<div className="mb-4 flex gap-4 flex-wrap">
					<div className="flex-1 min-w-[120px]">
						<label className="block text-75 text-sm font-medium mb-2">
							排序
						</label>
						<input
							type="number"
							value={order}
							onChange={(e) => setOrder(Number(e.target.value))}
							min={0}
							className="input-base w-full"
						/>
						<p className="text-50 text-xs mt-1">数字越小越靠前</p>
					</div>

					<div className="flex items-center gap-2 pt-6">
						<input
							type="checkbox"
							id="showInNav"
							checked={showInNav}
							onChange={(e) => setShowInNav(e.target.checked)}
							className="w-4 h-4 rounded border-[var(--border-light)]"
						/>
						<label htmlFor="showInNav" className="text-75 text-sm">
							显示在导航中
						</label>
					</div>
				</div>

				<div className="mb-6">
					<label className="block text-75 text-sm font-medium mb-2">状态</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setStatus(request_CreatePageRequest.status.DRAFT)}
							className={`btn-regular btn-sm py-1.5 px-3 ${
								status === request_CreatePageRequest.status.DRAFT
									? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
									: ""
							}`}
						>
							草稿
						</button>
						<button
							type="button"
							onClick={() =>
								setStatus(request_CreatePageRequest.status.PUBLISHED)
							}
							className={`btn-regular btn-sm py-1.5 px-3 ${
								status === request_CreatePageRequest.status.PUBLISHED
									? "border-[var(--primary)] bg-[var(--btn-regular-bg-active)]"
									: ""
							}`}
						>
							发布
						</button>
					</div>
				</div>

				<div className="flex gap-2">
					<LoadingButton
						type="submit"
						loading={createMutation.isPending || updateMutation.isPending}
						className="btn-regular btn-sm py-1.5 px-4 hover:bg-[var(--btn-regular-bg-hover)]"
					>
						{isEdit ? "更新" : "创建"}
					</LoadingButton>
					<button
						type="button"
						onClick={() => navigate("/admin/pages")}
						className="btn-plain btn-sm py-1.5 px-4"
					>
						取消
					</button>
				</div>
			</form>
		</div>
	);
}
