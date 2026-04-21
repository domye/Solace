/**
 * 表单组件
 */

function FormFieldWrapper({
	label,
	required,
	error,
	children,
	htmlFor,
}: {
	label: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
	htmlFor?: string;
}) {
	return (
		<div className="mb-4">
			<label htmlFor={htmlFor} className="block text-75 text-sm font-medium mb-2">
				{label}
				{required && <span className="text-[var(--primary)] ml-1">*</span>}
			</label>
			{children}
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
}

export function LoadingButton({
	loading,
	onClick,
	children,
	className = "",
	type = "button",
	disabled,
}: {
	loading: boolean;
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
	type?: "button" | "submit";
	disabled?: boolean;
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			className={`btn-regular rounded-[var(--radius-medium)] py-3 px-6 font-medium scale-animation ripple ${className} ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			{loading ? (
				<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
			) : (
				children
			)}
		</button>
	);
}

export function InputField({
	label,
	error,
	type = "text",
	placeholder,
	value,
	onChange,
	required,
	id,
}: {
	label: string;
	error?: string;
	type?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	id?: string;
}) {
	const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
	return (
		<FormFieldWrapper label={label} required={required} error={error} htmlFor={inputId}>
			<input
				id={inputId}
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`input-base ${error ? "border-red-500 focus:border-red-500" : ""}`}
			/>
		</FormFieldWrapper>
	);
}

export function TextAreaField({
	label,
	error,
	placeholder,
	value,
	onChange,
	rows = 4,
	required,
	id,
}: {
	label: string;
	error?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	rows?: number;
	required?: boolean;
	id?: string;
}) {
	const inputId = id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
	return (
		<FormFieldWrapper label={label} required={required} error={error} htmlFor={inputId}>
			<textarea
				id={inputId}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className={`input-base resize-none ${error ? "border-red-500 focus:border-red-500" : ""}`}
			/>
		</FormFieldWrapper>
	);
}
