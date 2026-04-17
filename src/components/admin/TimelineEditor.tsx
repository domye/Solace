/**
 * 时间线编辑器
 *
 * 用于 About 模板的时间线事件可视化编辑
 */

import { ListEditor, type ListEditorConfig } from "./ListEditor";
import type { TimelineEvent } from "@/types";

const timelineConfig: ListEditorConfig<TimelineEvent> = {
	itemLabel: "时间线事件",
	idField: "date",
	displayField: "title",
	secondaryFields: ["date"],
	createEmpty: () => ({
		date: "",
		title: "",
		description: "",
		type: "milestone",
	}),
	sortField: "date",
	sortDirection: "desc",
	fields: [
		{
			name: "date",
			label: "日期",
			type: "date",
			required: true,
			placeholder: "选择日期",
		},
		{
			name: "title",
			label: "标题",
			type: "text",
			required: true,
			placeholder: "事件标题",
		},
		{
			name: "description",
			label: "描述",
			type: "textarea",
			placeholder: "事件详细描述...",
		},
		{
			name: "type",
			label: "类型",
			type: "select",
			defaultValue: "milestone",
			options: [
				{
					value: "milestone",
					label: "里程碑",
					icon: "material-symbols:flag-outline-rounded",
				},
				{
					value: "work",
					label: "工作",
					icon: "material-symbols:work-outline-rounded",
				},
				{
					value: "education",
					label: "教育",
					icon: "material-symbols:school-outline-rounded",
				},
				{
					value: "award",
					label: "奖项",
					icon: "material-symbols:trophy-outline-rounded",
				},
			],
		},
		{
			name: "icon",
			label: "自定义图标",
			type: "text",
			placeholder: "material-symbols:...",
			help: "可选，覆盖默认图标",
		},
	],
	renderItem: (item) => (
		<div className="flex gap-1 mt-1">
			{item.type && (
				<span className="bg-[var(--bg-secondary)] text-[var(--text-50)] rounded-[var(--radius-small)] px-1.5 py-0.5 text-xs">
					{item.type === "milestone"
						? "里程碑"
						: item.type === "work"
							? "工作"
							: item.type === "education"
								? "教育"
								: "奖项"}
				</span>
			)}
		</div>
	),
};

interface TimelineEditorProps {
	timeline: TimelineEvent[];
	onChange: (timeline: TimelineEvent[]) => void;
}

export function TimelineEditor({ timeline, onChange }: TimelineEditorProps) {
	return (
		<ListEditor items={timeline} onChange={onChange} config={timelineConfig} />
	);
}
