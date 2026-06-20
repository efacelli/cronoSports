/**
 * Select de formulario reutilizable.
 * options: [{ value, label }]
 */
export default function Select({
  label,
  id,
  error,
  required = false,
  options = [],
  placeholder = 'Seleccionar...',
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
      <select
        id={id}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
