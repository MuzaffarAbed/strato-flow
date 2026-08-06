interface FormAlertProps {
  variant?: 'error' | 'success';
  title?: string;
  message?: string;
  messages?: string[];
}

export default function FormAlert({ variant = 'error', title, message, messages }: FormAlertProps) {
  const items = messages?.length ? messages : message ? [message] : [];
  if (!items.length) return null;

  const isError = variant === 'error';
  const containerClass = isError
    ? 'text-sm text-red-600 bg-red-500/10 border border-red-500/30'
    : 'text-sm text-green-700 bg-green-500/10 border border-green-500/30';
  const titleClass = isError ? 'text-red-700' : 'text-green-800';

  return (
    <div className={`rounded-lg p-3 ${containerClass}`} role="alert">
      {title && <p className={`font-medium mb-1 ${titleClass}`}>{title}</p>}
      {items.length === 1 ? (
        <p>{items[0]}</p>
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
