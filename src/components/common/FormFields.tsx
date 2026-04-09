/**
 * 表单组件
 *
 * 包含带加载状态的按钮、输入框、文本域
 */

/** 表单字段包装器 - 统一 label 和 error 展示 */
interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormFieldWrapper({ label, required, error, children }: FormFieldWrapperProps) {
  return (
    <div className="mb-4">
      <label className="block text-75 text-sm font-medium mb-2">
        {label}
        {required && <span className="text-[var(--primary)] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

/** 带加载状态的按钮 */
interface LoadingButtonProps {
  loading: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function LoadingButton({
  loading,
  onClick,
  children,
  className = '',
  type = 'button',
  disabled,
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn-regular rounded-[var(--radius-medium)] py-3 px-6 font-medium scale-animation ripple ${className} ${
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

/** 输入框 */
interface InputFieldProps {
  label: string;
  error?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function InputField({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
}: InputFieldProps) {
  return (
    <FormFieldWrapper label={label} required={required} error={error}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-base ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
    </FormFieldWrapper>
  );
}

/** 文本域 */
interface TextAreaFieldProps {
  label: string;
  error?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}

export function TextAreaField({
  label,
  error,
  placeholder,
  value,
  onChange,
  rows = 4,
  required,
}: TextAreaFieldProps) {
  return (
    <FormFieldWrapper label={label} required={required} error={error}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`input-base resize-none ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
    </FormFieldWrapper>
  );
}
