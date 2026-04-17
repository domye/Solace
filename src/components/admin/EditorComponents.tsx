/**
 * 编辑器通用组件
 *
 * 提供各编辑器共享的 UI 组件，统一样式和行为
 */
import { SafeIcon } from "@/components/common/ui";

// ============ 类型定义 ============

interface InputFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: "text" | "url" | "date" | "number";
	required?: boolean;
	help?: string;
	className?: string;
}

interface TextAreaFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	rows?: number;
	required?: boolean;
	help?: string;
	className?: string;
}

interface SelectFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: Array<{ value: string; label: string; icon?: string }>;
	className?: string;
}

interface TagsFieldProps {
	label: string;
	tags: string[];
	onAdd: (tag: string) => void;
	onRemove: (tag: string) => void;
	inputValue: string;
	onInputChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

interface CoordsFieldProps {
	label?: string;
	value: { lat?: number; lng?: number };
	onChange: (coords: { lat?: number; lng?: number }) => void;
	className?: string;
}

interface ActionButtonsProps {
	onEdit: () => void;
	onDelete: () => void;
}

interface SortButtonsProps {
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}

interface EditFormHeaderProps {
	mode: "add" | "edit";
	itemLabel: string;
}

interface EditFormActionsProps {
	onSave: () => void;
	onCancel: () => void;
	saveDisabled?: boolean;
}

// ============ 子组件 ============

/** 输入字段 */
export function InputField({
	label,
	value,
	onChange,
	placeholder,
	type = "text",
	required,
	help,
	className,
}: InputFieldProps) {
	return (
		<div className={className}>
			<label className="block text-[var(--text-50)] text-xs mb-1">
				{label}
				{required && <span className="text-red-400 ml-1">*</span>}
			</label>
			<input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="input-base w-full"
			/>
			{help && <p className="text-[var(--text-40)] text-xs mt-0.5">{help}</p>}
		</div>
	);
}

/** 多行文本字段 */
export function TextAreaField({
	label,
	value,
	onChange,
	placeholder,
	rows = 3,
	required,
	help,
	className,
}: TextAreaFieldProps) {
	return (
		<div className={className}>
			<label className="block text-[var(--text-50)] text-xs mb-1">
				{label}
				{required && <span className="text-red-400 ml-1">*</span>}
			</label>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="input-base w-full"
			/>
			{help && <p className="text-[var(--text-40)] text-xs mt-0.5">{help}</p>}
		</div>
	);
}

/** 选择字段（按钮组） */
export function SelectField({
	label,
	value,
	onChange,
	options,
	className,
}: SelectFieldProps) {
	return (
		<div className={className}>
			<label className="block text-[var(--text-50)] text-xs mb-1">{label}</label>
			<div className="flex gap-2">
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(opt.value)}
						className={`rounded-[var(--radius-medium)] py-1.5 px-3 text-sm flex items-center gap-1 transition-all ${
							value === opt.value
								? "btn-primary btn-sm py-1 px-2.5"
								: "btn-regular"
						}`}
					>
						{opt.icon && <SafeIcon icon={opt.icon} size={14} />}
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}

/** 标签字段 */
export function TagsField({
	label,
	tags,
	onAdd,
	onRemove,
	inputValue,
	onInputChange,
	placeholder = "输入后按 Enter",
	className,
}: TagsFieldProps) {
	return (
		<div className={className}>
			<label className="block text-[var(--text-50)] text-xs mb-1">{label}</label>
			<div className="flex gap-2">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onAdd(inputValue);
						}
					}}
					placeholder={placeholder}
					className="input-base flex-1"
				/>
				<button
					type="button"
					onClick={() => onAdd(inputValue)}
					className="btn-regular btn-sm px-2.5"
				>
					添加
				</button>
			</div>
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-1 mt-2">
					{tags.map((tag) => (
						<span
							key={tag}
							className="bg-[var(--primary)]/20 text-[var(--primary)] rounded-[var(--radius-small)] px-2 py-0.5 text-xs flex items-center gap-1"
						>
							{tag}
							<button
								type="button"
								onClick={() => onRemove(tag)}
								className="hover:bg-white/20 rounded"
							>
								<SafeIcon icon="material-symbols:close-rounded" size={12} />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}

/** 坐标字段 */
export function CoordsField({
	label = "坐标",
	value,
	onChange,
	className,
}: CoordsFieldProps) {
	return (
		<div className={className}>
			<label className="block text-[var(--text-50)] text-xs mb-1">{label}</label>
			<div className="flex gap-2">
				<input
					type="number"
					step="any"
					value={value.lat ?? ""}
					onChange={(e) => onChange({ ...value, lat: Number(e.target.value) || undefined })}
					placeholder="纬度"
					className="input-base flex-1"
				/>
				<input
					type="number"
					step="any"
					value={value.lng ?? ""}
					onChange={(e) => onChange({ ...value, lng: Number(e.target.value) || undefined })}
					placeholder="经度"
					className="input-base flex-1"
				/>
			</div>
		</div>
	);
}

/** 编辑/删除按钮组 */
export function ActionButtons({ onEdit, onDelete }: ActionButtonsProps) {
	return (
		<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
			<button
				type="button"
				onClick={onEdit}
				className="p-1.5 hover:bg-[var(--btn-regular-bg-hover)] rounded-[var(--radius-small)] text-[var(--text-50)] hover:text-[var(--text-75)]"
				title="编辑"
			>
				<SafeIcon icon="material-symbols:edit-outline-rounded" size={16} />
			</button>
			<button
				type="button"
				onClick={onDelete}
				className="p-1.5 hover:bg-red-500/10 rounded-[var(--radius-small)] text-[var(--text-50)] hover:text-red-500"
				title="删除"
			>
				<SafeIcon icon="material-symbols:delete-outline-rounded" size={16} />
			</button>
		</div>
	);
}

/** 上移/下移按钮组 */
export function SortButtons({
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: SortButtonsProps) {
	return (
		<div className="flex items-center gap-1 text-[var(--text-40)]">
			<button
				type="button"
				onClick={onMoveUp}
				disabled={!canMoveUp}
				className="p-1 hover:text-[var(--text-75)] disabled:opacity-30 disabled:cursor-not-allowed"
				title="上移"
			>
				<SafeIcon icon="material-symbols:arrow-upward-rounded" size={16} />
			</button>
			<button
				type="button"
				onClick={onMoveDown}
				disabled={!canMoveDown}
				className="p-1 hover:text-[var(--text-75)] disabled:opacity-30 disabled:cursor-not-allowed"
				title="下移"
			>
				<SafeIcon icon="material-symbols:arrow-downward-rounded" size={16} />
			</button>
		</div>
	);
}

/** 编辑表单标题 */
export function EditFormHeader({ mode, itemLabel }: EditFormHeaderProps) {
	return (
		<h4 className="text-[var(--text-75)] font-medium text-sm">
			{mode === "add" ? `添加新${itemLabel}` : `编辑${itemLabel}`}
		</h4>
	);
}

/** 编辑表单操作按钮 */
export function EditFormActions({
	onSave,
	onCancel,
	saveDisabled,
}: EditFormActionsProps) {
	return (
		<div className="flex gap-2 pt-2">
			<button
				type="button"
				onClick={onSave}
				disabled={saveDisabled}
				className="btn-primary btn-sm py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				保存
			</button>
			<button
				type="button"
				onClick={onCancel}
				className="btn-plain btn-sm py-1.5 px-3"
			>
				取消
			</button>
		</div>
	);
}

/** 标题栏（带添加按钮） */
export function EditorHeader({
	title,
	count,
	onAdd,
}: {
	title: string;
	count?: number;
	onAdd: () => void;
}) {
	return (
		<div className="flex items-center justify-between">
			<h3 className="text-[var(--text-75)] font-medium">
				{title}
				{count !== undefined && ` (${count})`}
			</h3>
			<button
				type="button"
				onClick={onAdd}
				className="btn-regular btn-sm py-1.5 px-3 flex items-center gap-1"
			>
				<SafeIcon icon="material-symbols:add-rounded" size={16} />
				添加
			</button>
		</div>
	);
}

/** 空状态提示 */
export function EmptyState({ message }: { message: string }) {
	return (
		<div className="card-base p-4 text-center text-[var(--text-50)]">
			<p>{message}</p>
		</div>
	);
}