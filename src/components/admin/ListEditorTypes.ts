/**
 * ListEditor 类型定义
 */

export interface ListEditorConfig<T> {
	/** 列表项的标签 */
	itemLabel: string;
	/** 唯一标识字段名（用于 React key） */
	idField: keyof T;
	/** 显示字段名（用于列表展示） */
	displayField: keyof T;
	/** 列表项次要显示字段 */
	secondaryFields?: (keyof T)[];
	/** 字段配置 */
	fields: ListEditorField<T>[];
	/** 创建空项的函数 */
	createEmpty: () => T;
	/** 自定义渲染函数（可选） */
	renderItem?: (item: T) => React.ReactNode;
	/** 自动排序字段（可选） */
	sortField?: keyof T;
	/** 排序方向：desc 为降序（最新的在前），asc 为升序（最旧的在前） */
	sortDirection?: "asc" | "desc";
	/** 是否显示手动排序按钮 */
	enableManualSort?: boolean;
}

export interface ListEditorField<T> {
	/** 字段名 */
	name: keyof T;
	/** 字段标签 */
	label: string;
	/** 字段类型 */
	type: "text" | "url" | "textarea" | "select" | "tags" | "coords" | "date";
	/** 是否必填 */
	required?: boolean;
	/** 占位符 */
	placeholder?: string;
	/** 帮助文本 */
	help?: string;
	/** select 类型的选项 */
	options?: { value: string; label: string; icon?: string }[];
	/** 默认值（用于新项） */
	defaultValue?: string | string[] | { lat: number; lng: number };
}