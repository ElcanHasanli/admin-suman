import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <Field label={label} error={error}>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${error ? 'border-red-300' : ''} ${className}`}
          {...props}
        />
      </Field>
    );
  }
);

Input.displayName = 'Input';

function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
