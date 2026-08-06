import { labelFieldClass } from '../../utils/apiError';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div>
      <label className={labelFieldClass(!!error)}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
