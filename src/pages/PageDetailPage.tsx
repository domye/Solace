/**
 * 页面详情页 - 根据 template 类型选择渲染模板
 *
 * 性能优化：
 * - 模板懒加载，特别是 FootprintsTemplate（包含 ECharts）
 */

import { useParams } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { usePageBySlug } from "@/hooks";
import { parseFrontmatter } from "@/utils/frontmatter";
import {
	ArticleDetailSkeleton,
	ErrorDisplay,
	NotFoundDisplay,
} from "@/components";
import type {
	AboutFrontmatter,
	ProjectsFrontmatter,
	FootprintsFrontmatter,
} from "@/types";

// 懒加载模板组件 - FootprintsTemplate 包含 ECharts，需延迟加载
const DefaultTemplate = lazy(() =>
	import("@/components/page/templates/DefaultTemplate").then((m) => ({
		default: m.DefaultTemplate,
	})),
);
const AboutTemplate = lazy(() =>
	import("@/components/page/templates/AboutTemplate").then((m) => ({
		default: m.AboutTemplate,
	})),
);
const ProjectsTemplate = lazy(() =>
	import("@/components/page/templates/ProjectsTemplate").then((m) => ({
		default: m.ProjectsTemplate,
	})),
);
const FootprintsTemplate = lazy(() =>
	import("@/components/page/templates/FootprintsTemplate").then((m) => ({
		default: m.FootprintsTemplate,
	})),
);

// 模板加载占位符
function TemplateLoadingFallback() {
	return <ArticleDetailSkeleton />;
}

export function PageDetailPage() {
	const { slug } = useParams<{ slug: string }>();
	const { data: page, isLoading, error } = usePageBySlug(slug ?? "");

	// 切换页面时平滑滚动到顶部
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [slug]);

	if (error) return <ErrorDisplay message="加载页面失败" />;
	if (isLoading) return <ArticleDetailSkeleton />;
	if (!page) return <NotFoundDisplay message="未找到页面" />;

	// 解析 frontmatter
	const { frontmatter, markdown } = parseFrontmatter(page.content);

	// 根据模板类型选择渲染组件（使用懒加载）
	const renderTemplate = () => {
		switch (page.template) {
			case "about":
				return (
					<Suspense fallback={<TemplateLoadingFallback />}>
						<AboutTemplate
							frontmatter={frontmatter as AboutFrontmatter}
							markdown={markdown}
						/>
					</Suspense>
				);
			case "projects":
				return (
					<Suspense fallback={<TemplateLoadingFallback />}>
						<ProjectsTemplate
							frontmatter={frontmatter as ProjectsFrontmatter}
							markdown={markdown}
						/>
					</Suspense>
				);
			case "footprints":
				return (
					<Suspense fallback={<TemplateLoadingFallback />}>
						<FootprintsTemplate
							frontmatter={frontmatter as FootprintsFrontmatter}
							markdown={markdown}
						/>
					</Suspense>
				);
			default:
				return (
					<Suspense fallback={<TemplateLoadingFallback />}>
						<DefaultTemplate markdown={markdown} page={page} />
					</Suspense>
				);
		}
	};

	return (
		<article className="flex-1 min-w-0 fade-in-up">{renderTemplate()}</article>
	);
}
