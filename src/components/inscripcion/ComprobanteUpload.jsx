import { useRef, useState } from 'react';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const TAMANO_MAX_MB = 5;

/**
 * Input de subida de archivo (comprobante de pago) con validacion
 * de tipo y tamaño, y preview del nombre del archivo seleccionado.
 *
 * @param {Object} props
 * @param {File|null} props.file
 * @param {(file: File|null) => void} props.onChange
 * @param {string} [props.error]
 */
export default function ComprobanteUpload({ file, onChange, error }) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) {
      onChange(null);
      return;
    }

    if (!TIPOS_PERMITIDOS.includes(selected.type)) {
      setLocalError('Formato no permitido. Subí una imagen (JPG, PNG, WEBP) o un PDF.');
      onChange(null);
      return;
    }

    if (selected.size > TAMANO_MAX_MB * 1024 * 1024) {
      setLocalError(`El archivo no puede superar los ${TAMANO_MAX_MB}MB.`);
      onChange(null);
      return;
    }

    setLocalError('');
    onChange(selected);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const mostrarError = error || localError;

  return (
    <div>
      <label className="form-label">
        Comprobante de pago <span className="text-coral">*</span>
      </label>

      {!file && (
        <label
          htmlFor="comprobante"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 text-center transition hover:bg-black/[0.02] ${
            mostrarError ? 'border-danger' : 'border-slate/30'
          }`}
        >
          <svg className="h-8 w-8 text-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span className="text-sm font-medium text-navy">
            Hacé clic para subir tu comprobante
          </span>
          <span className="text-xs text-slate">JPG, PNG, WEBP o PDF · máx. {TAMANO_MAX_MB}MB</span>
          <input
            ref={inputRef}
            id="comprobante"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {file && (
        <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-navy">{file.name}</p>
              <p className="text-xs text-slate">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Quitar
          </button>
        </div>
      )}

      {mostrarError && <p className="form-error">{mostrarError}</p>}
    </div>
  );
}
