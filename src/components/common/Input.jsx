/**
 * Input de formulario reutilizable con label, mensaje de error
 * y soporte para texto de ayuda.
 */
export default function Input({
  label,
  id,
  error,
  hint,
  required = false,
  className = '',
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-coral">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-sm text-slate">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
