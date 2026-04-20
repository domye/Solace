/**
 * Widget 组件导出
 *
 * 侧边栏相关组件：个人信息、分类、标签、搜索、目录等
 *
 * 性能优化：
 * - FootprintsMap 不在此导出，仅通过懒加载使用（包含 ECharts ~1MB）
 * - 使用路径导入: import { FootprintsMap } from "@/components/widget/FootprintsMap"
 */

export { HuePicker } from "./HuePicker";
export { Profile } from "./Profile";
export { Categories } from "./Categories";
export { CategoryBar } from "./CategoryBar";
export { Tags } from "./Tags";
export { SearchModal } from "./SearchModal";
export { TableOfContents, type TocHeading } from "./TableOfContents";
export { ContributionCalendar } from "./ContributionCalendar";
export { ProjectCard } from "./ProjectCard";
export { FootprintCard } from "./FootprintCard";
// FootprintsMap 移除静态导出 - 使用懒加载防止 ECharts 打入首屏
