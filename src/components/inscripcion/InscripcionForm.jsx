import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCarreras } from '../../api/carreras.api';
import { getModalidadesByCarrera } from '../../api/modalidades.api';
import { crearInscripcion, subirComprobante } from '../../api/inscripciones.api';
import { calcularEdad, calcularModalidadSugerida } from '../../utils/calcularEdad';
import { TIPO_CARRERA_LABEL } from '../../utils/formatters';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import ComprobanteUpload from './ComprobanteUpload';
import CategoriaPreview from './CategoriaPreview';
import Toast from '../common/Toast';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino',  label: 'Femenino'  },
  { value: 'otro',      label: 'Otro / Prefiero no decir' }
];

const INITIAL_FORM = {
  id_carrera: '', id_modalidad: '', apellido: '', nombre: '', dni: '',
  fecha_nacimiento: '', sexo: '', email: '', telefono: '', ciudad: '', observaciones: ''
};

// ─── Botón copiar con feedback ──────────────────────────────────────────────
function CopyButton({ value, onCopied }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback para navegadores sin clipboard API
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition
        ${copied
          ? 'bg-success/15 text-success'
          : 'bg-navy/5 text-navy hover:bg-navy/10'
        }`}
      title="Copiar"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

// ─── Panel de datos de pago ──────────────────────────────────────────────────
function DatosPago({ carrera, modalidadSeleccionada, onCopied }) {
  if (!carrera) return null;

  const { alias, cbu, whatsapp, precio_base } = carrera;
  if (!alias && !cbu && !whatsapp) return null;

  // Monto = precio_base de la carrera + precio_extra de la modalidad
  const precioExtra = modalidadSeleccionada ? Number(modalidadSeleccionada.precio_extra || 0) : 0;
  const montoTotal  = Number(precio_base || 0) + precioExtra;
  const montoFmt    = montoTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const waUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Tengo una consulta sobre las inscripciones de ' + carrera.nombre)}`
    : null;

  return (
    <div className="rounded-xl border-2 border-coral/60 bg-coral/10 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy flex items-center gap-2">
          <svg className="h-4 w-4 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Datos para la transferencia
        </p>
        {montoTotal > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate uppercase tracking-wide">Monto a transferir</p>
            <p className="font-mono font-bold text-lg text-coral">{montoFmt}</p>
            {precioExtra > 0 && (
              <p className="text-[11px] text-slate">
                Base {Number(precio_base).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                {' '}+ extra {precioExtra.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {alias && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-4 py-3">
            <div>
              <p className="text-xs text-slate uppercase tracking-wide">Alias</p>
              <p className="font-mono font-semibold text-navy">{alias}</p>
            </div>
            <CopyButton value={alias} onCopied={onCopied} />
          </div>
        )}

        {cbu && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-4 py-3">
            <div>
              <p className="text-xs text-slate uppercase tracking-wide">CBU</p>
              <p className="font-mono font-semibold text-navy text-sm break-all">{cbu}</p>
            </div>
            <CopyButton value={cbu} onCopied={onCopied} />
          </div>
        )}
      </div>

      {waUrl && (
        <div className="pt-1">
          <p className="text-xs text-slate mb-2">¿Tenés dudas? Contactate con el organizador</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d] active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Escribir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Panel lateral — Mapa ────────────────────────────────────────────────────
function MapaCarrera({ carrera }) {
  if (!carrera?.url_mapa) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl bg-navy/5 text-slate text-sm p-6 text-center">
        <div>
          <svg className="mx-auto mb-2 h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <p>Sin mapa configurado para esta carrera.</p>
        </div>
      </div>
    );
  }

  // Convierte URL normal de Google Maps a URL embebida si es necesario
  let src = carrera.url_mapa;
  if (src.includes('google.com/maps') && !src.includes('/embed')) {
    src = `https://maps.google.com/maps?q=${encodeURIComponent(carrera.ubicacion || carrera.nombre)}&output=embed`;
  }

  return (
    <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-black/5 shadow-sm">
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ minHeight: 280, border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa de ${carrera.nombre}`}
      />
    </div>
  );
}

// ─── Panel lateral — Recorrido ───────────────────────────────────────────────
function RecorridoCarrera({ carrera }) {
  if (!carrera?.imagen_recorrido_url) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl bg-navy/5 text-slate text-sm p-6 text-center">
        <div>
          <svg className="mx-auto mb-2 h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p>Sin imagen de recorrido configurada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-black/5 shadow-sm">
      <img
        src={carrera.imagen_recorrido_url}
        alt={`Recorrido de ${carrera.nombre}`}
        className="h-full w-full object-contain bg-white"
        style={{ minHeight: 280 }}
      />
    </div>
  );
}

// ─── Formulario principal ────────────────────────────────────────────────────
export default function InscripcionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const carreraPreseleccionada = searchParams.get('carrera') || '';

  const [carreras, setCarreras]               = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [modalidades, setModalidades]         = useState([]);
  const [loadingModalidades, setLoadingModalidades] = useState(false);
  const [form, setForm]                       = useState({ ...INITIAL_FORM, id_carrera: carreraPreseleccionada });
  const [comprobante, setComprobante]         = useState(null);
  const [errors, setErrors]                   = useState({});
  const [submitting, setSubmitting]           = useState(false);
  const [submitError, setSubmitError]         = useState('');
  const [toast, setToast]                     = useState(null);

  useEffect(() => {
    getCarreras({ estado: 'activa' })
      .then((res) => setCarreras(res.data.data))
      .catch(() => setSubmitError('No se pudieron cargar las carreras disponibles.'))
      .finally(() => setLoadingCarreras(false));
  }, []);

  // Carga modalidades cuando cambia la carrera y resetea la selección
  useEffect(() => {
    if (!form.id_carrera) { setModalidades([]); return; }
    setLoadingModalidades(true);
    setForm((prev) => ({ ...prev, id_modalidad: '' }));
    getModalidadesByCarrera(form.id_carrera)
      .then((res) => setModalidades(res.data.data))
      .catch(() => setModalidades([]))
      .finally(() => setLoadingModalidades(false));
  }, [form.id_carrera]);

  const carreraSeleccionada = useMemo(
    () => carreras.find((c) => String(c.id) === String(form.id_carrera)) || null,
    [carreras, form.id_carrera]
  );


  const edad = useMemo(() => calcularEdad(form.fecha_nacimiento), [form.fecha_nacimiento]);

  // Modalidad seleccionada manualmente por el usuario
  const modalidadSeleccionada = useMemo(
    () => modalidades.find((m) => String(m.id) === String(form.id_modalidad)) || null,
    [modalidades, form.id_modalidad]
  );

  // Modalidades compatibles con edad y sexo (para sugerir)
  const modalidadesCompatibles = useMemo(
    () => modalidades.filter((m) => {
      if (!edad || !form.sexo) return true; // muestra todas si no hay datos aún
      const sexoOk  = m.sexo === 'otro' || m.sexo === form.sexo;
      const edadOk  = edad >= m.edad_minima && edad <= m.edad_maxima;
      return sexoOk && edadOk;
    }),
    [modalidades, edad, form.sexo]
  );

  const modalidadSugerida = useMemo(
    () => modalidadSeleccionada || calcularModalidadSugerida(modalidades, edad, form.sexo),
    [modalidadSeleccionada, modalidades, edad, form.sexo]
  );

  const carreraOptions = useMemo(
    () => carreras.map((c) => ({
      value: c.id,
      label: `${c.nombre} (${TIPO_CARRERA_LABEL[c.tipo] || c.tipo})`
    })),
    [carreras]
  );

  const handleChange = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCopied = useCallback(() => {
    setToast({
      message: 'No te olvides de guardar el comprobante de transferencia para completar tu inscripción.',
      type: 'warning'
    });
  }, []);

  const validar = () => {
    const err = {};
    if (!form.id_carrera)           err.id_carrera       = 'Seleccioná una carrera';
    if (!form.id_modalidad)         err.id_modalidad     = 'Seleccioná una modalidad';
    if (!form.apellido.trim())      err.apellido         = 'Ingresá tu apellido';
    if (!form.nombre.trim())        err.nombre           = 'Ingresá tu nombre';
    if (!form.dni.trim())           err.dni              = 'Ingresá tu DNI';
    else if (!/^[0-9A-Za-z.-]{5,20}$/.test(form.dni.trim()))
                                    err.dni              = 'Formato de DNI inválido';
    if (!form.fecha_nacimiento)     err.fecha_nacimiento = 'Ingresá tu fecha de nacimiento';
    else if (new Date(form.fecha_nacimiento) > new Date())
                                    err.fecha_nacimiento = 'La fecha no puede ser futura';
    if (!form.sexo)                 err.sexo             = 'Seleccioná una opción';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                    err.email            = 'Formato de email inválido';
    if (!comprobante)               err.comprobante      = 'Debés adjuntar el comprobante de pago';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validar()) return;
    setSubmitting(true);
    try {
      const res = await crearInscripcion({
        id_carrera:      Number(form.id_carrera),
        id_modalidad:    Number(form.id_modalidad),
        apellido:        form.apellido.trim(),
        nombre:          form.nombre.trim(),
        dni:             form.dni.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        sexo:            form.sexo,
        email:           form.email.trim() || undefined,
        telefono:        form.telefono.trim() || undefined,
        ciudad:          form.ciudad.trim() || undefined,
        observaciones:   form.observaciones.trim() || undefined
      });

      const inscripcion = res.data.data;
      await subirComprobante(inscripcion.id, comprobante);

      navigate('/confirmacion', {
        state: {
          inscripcion: {
            ...inscripcion,
            carrera_nombre: carreraSeleccionada?.nombre
          }
        }
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Ocurrió un error al registrar tu inscripción. Intentá nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tieneInfoCarrera = Boolean(carreraSeleccionada);

  // ── Formulario central ──────────────────────────────────────────────────────
  const formulario = (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {submitError && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {submitError}
        </div>
      )}

      <Select
        label="Carrera"
        id="id_carrera"
        required
        value={form.id_carrera}
        onChange={handleChange('id_carrera')}
        options={carreraOptions}
        error={errors.id_carrera}
        placeholder={loadingCarreras ? 'Cargando carreras...' : 'Seleccioná una carrera'}
        disabled={loadingCarreras}
      />

      {/* Selector de modalidad — debajo de carrera */}
      {form.id_carrera && (
        <div>
          <label className="form-label">
            Modalidad <span className="text-coral">*</span>
          </label>
          {loadingModalidades ? (
            <div className="form-input text-slate text-sm">Cargando modalidades...</div>
          ) : modalidades.length === 0 ? (
            <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              Esta carrera no tiene modalidades configuradas aún.
            </div>
          ) : (
            <select
              id="id_modalidad"
              className={`form-input ${errors.id_modalidad ? 'form-input-error' : ''}`}
              value={form.id_modalidad}
              onChange={handleChange('id_modalidad')}
            >
              <option value="">Seleccioná una modalidad...</option>
              {modalidades.map((m) => {
                const esCompatible = !edad || !form.sexo ||
                  ((m.sexo === 'otro' || m.sexo === form.sexo) &&
                   edad >= m.edad_minima && edad <= m.edad_maxima);
                return (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                    {m.distancia ? ` — ${m.distancia}` : ''}
                    {!esCompatible ? ' ⚠ (fuera de rango)' : ''}
                  </option>
                );
              })}
            </select>
          )}
          {errors.id_modalidad && <p className="form-error">{errors.id_modalidad}</p>}
        </div>
      )}

      {/* Info de pago dinámica — debajo de modalidad */}
      {carreraSeleccionada && (
        <DatosPago
          carrera={carreraSeleccionada}
          modalidadSeleccionada={modalidadSeleccionada}
          onCopied={handleCopied}
        />
      )}

      {/* Apellido y Nombre — campos separados */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Apellido"
          id="apellido"
          required
          placeholder="Ej: Pérez"
          value={form.apellido}
          onChange={handleChange('apellido')}
          error={errors.apellido}
        />
        <Input
          label="Nombre"
          id="nombre"
          required
          placeholder="Ej: Juan Carlos"
          value={form.nombre}
          onChange={handleChange('nombre')}
          error={errors.nombre}
        />
      </div>

      <Input
        label="DNI"
        id="dni"
        required
        placeholder="Ej: 30123456"
        value={form.dni}
        onChange={handleChange('dni')}
        error={errors.dni}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Fecha de nacimiento"
          id="fecha_nacimiento"
          type="date"
          required
          max={new Date().toISOString().split('T')[0]}
          value={form.fecha_nacimiento}
          onChange={handleChange('fecha_nacimiento')}
          error={errors.fecha_nacimiento}
        />
        <Select
          label="Sexo"
          id="sexo"
          required
          value={form.sexo}
          onChange={handleChange('sexo')}
          options={SEXO_OPTIONS}
          error={errors.sexo}
          placeholder="Seleccioná una opción"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
        />
        <Input
          label="Teléfono"
          id="telefono"
          type="tel"
          placeholder="Ej: 3856 123456"
          value={form.telefono}
          onChange={handleChange('telefono')}
          error={errors.telefono}
        />
      </div>

      <Input
        label="Ciudad"
        id="ciudad"
        placeholder="Ej: La Banda"
        value={form.ciudad}
        onChange={handleChange('ciudad')}
        error={errors.ciudad}
      />

      <CategoriaPreview
        edad={edad}
        modalidad={modalidadSugerida}
        sexo={form.sexo}
        sinModalidades={!form.id_carrera}
      />

      <div>
        <label className="form-label" htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          className="form-input min-h-[80px] resize-y"
          placeholder="Alguna aclaración que nos quieras hacer?"
          value={form.observaciones}
          onChange={handleChange('observaciones')}
        />
      </div>

      <ComprobanteUpload
        file={comprobante}
        onChange={setComprobante}
        error={errors.comprobante}
      />

      <p className="text-xs text-slate">
        Al enviar, tu inscripción quedará en estado{' '}
        <span className="font-semibold text-warning">Pendiente</span> hasta que
        un administrador revise tu comprobante de pago.
      </p>

      <Button type="submit" loading={submitting} className="w-full text-base">
        Confirmar inscripción
      </Button>
    </form>
  );

  return (
    <>
      {/* Toast emergente */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Layout: si hay carrera seleccionada → 3 columnas en desktop */}
      {tieneInfoCarrera ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr] lg:items-start">
          {/* Columna izquierda: Mapa */}
          <div className="order-2 lg:order-1 lg:sticky lg:top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              Ubicación
            </p>
            <MapaCarrera carrera={carreraSeleccionada} />
          </div>

          {/* Columna central: Formulario */}
          <div className="order-1 lg:order-2">
            {formulario}
          </div>

          {/* Columna derecha: Recorrido */}
          <div className="order-3 lg:sticky lg:top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              Recorrido
            </p>
            <RecorridoCarrera carrera={carreraSeleccionada} />
          </div>
        </div>
      ) : (
        /* Sin carrera seleccionada → solo el formulario centrado */
        <div>{formulario}</div>
      )}
    </>
  );
}
