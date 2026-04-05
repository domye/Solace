import { Icon } from '@iconify/react';
import { useState } from 'react';

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
      className={`btn-regular rounded-lg py-3 px-6 font-medium ${className} ${
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <Icon icon="material-symbols:refresh-rounded" className="animate-spin text-xl" />
      ) : (
        children
      )}
    </button>
  );
}

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
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-75 text-sm font-medium mb-2">
        {label}
        {required && <span className="text-[var(--primary)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`input-base ${error ? 'border-red-500' : ''}`}
      />
      {error && focused && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

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
    <div className="mb-4">
      <label className="block text-75 text-sm font-medium mb-2">
        {label}
        {required && <span className="text-[var(--primary)] ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`input-base ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}