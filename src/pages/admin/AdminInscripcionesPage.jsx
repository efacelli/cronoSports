import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getInscripciones, verComprobante } from '../../api/inscripciones.api';
import { aprobarPago, rechazarPago, reabrirPago } from '../../api/pagos.api';
import { exportarInscriptosAprobados } from '../../api/exportacion.api';
import { notificarAprobacion } from '../../api/emails.api';
import { getCarreras } from '../../api/carreras.api';
import { API_BASE_URL } from '../../api/axiosClient';
import Badge from '../../components/common/Badge';
import EmailBadge from '../../components/common/EmailBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';
import Toast from '../../components/common/Toast';
import { formatearFecha, formatearFechaHora, TIPO_CARRERA_LABEL } from '../../utils/formatters';

export default function AdminInscripcionesPage() {
  const [searchParams] = useSearchParams();

  const [inscripciones, setInscripciones] = useState([]);
  const [carreras, setCarreras]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [exporting, setExporting]         = useState(false);

  const [filtroCarrera, setFiltroCarrera] = useState(searchParams.get('id_carrera') || '');
  const [filtroEstado,  setFiltroEstado]  = useState(searchParams.get('estado_pago') || '');
  const [filtroDni,     setFiltroDni]     = useState('');

  const [detalle,        setDetalle]       = useState(null);
  const [accionLoading,  setAccionLoading] = useState(false);
  const [accionError,    setAccionError]   = useState('');
  const [notifLoading,   setNotifLoading]  = useState(false);
  const [comprobanteLoading, setComprobanteLoading] = useState(false);
  const [toast,          setToast]         = useState(null);

  const fetchInscripciones = useCallback(() => {
    setLoading(true); setError('');
    const params = {};
    if (filtroCarrera)    params.id_carrera  = filtroCarrera;
    if (filtroEstado)     params.estado_pago = filtroEstado;
    if (filtroDni.trim()) params.dni         = filtroDni.trim();
    getInscripciones(params)
      .then((res) => setInscripciones(res.data.data))
      .catch(() => setError('No se pudieron cargar las inscripciones.'))
      .finally(() => setLoading(false));
  }, [filtroCarrera, filtroEstado, filtroDni]);

  useEffect(() => {
    getCarreras().then((res) => setCarreras(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchInscripciones(); }, [fetchInscripciones]);

  const carreraOptions = carreras.map((c) => ({ value: c.id, label: c.nombre }));

  // ── Acciones de pago ──────────────────────────────────────────────────────
  const handleAccion = async (accion, id) => {
    setAccionLoading(true); setAccionError('');
    try {
      if (accion === 'aprobar')  await aprobarPago(id);
      if (accion === 'rechazar') await rechazarPago(id);
      if (accion === 'reabrir')  await reabrirPago(id);
      const nuevoEstado = accion === 'aprobar' ? 'Aprobado' : accion === 'rechazar' ? 'Rechazado' : 'Pendiente';
      setInscripciones((prev) => prev.map((i) => i.id === id ? { ...i, estado_pago: nuevoEstado } : i));
      setDetalle((prev) => prev?.id === id ? { ...prev, estado_pago: nuevoEstado } : prev);
    } catch (err) {
      setAccionError(err.response?.data?.message || 'Error al procesar la acción.');
    } finally { setAccionLoading(false); }
  };

  // ── Notificar aprobación por email ────────────────────────────────────────
  const handleNotificar = async (id) => {
    setNotifLoading(true); setAccionError('');
    try {
      await notificarAprobacion(id);
      const ahora = new Date().toISOString();
      setInscripciones((prev) =>
        prev.map((i) => i.id === id
          ? { ...i, email_aprobacion_enviado: true, email_aprobacion_fecha: ahora }
          : i
        )
      );
      setDetalle((prev) =>
        prev?.id === id
          ? { ...prev, email_aprobacion_enviado: true, email_aprobacion_fecha: ahora }
          : prev
      );
      setToast({ message: 'Email de aprobación enviado correctamente.', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar el email.';
      if (err.response?.status === 409) {
        setAccionError('El email de aprobación ya fue enviado anteriormente.');
      } else {
        setAccionError(msg);
        setToast({ message: `Error al enviar email: ${msg}`, type: 'info' });
      }
    } finally { setNotifLoading(false); }
  };

  const handleVerComprobante = async (id) => {
    setComprobanteLoading(true);
    try {
      await verComprobante(id);
    } catch (err) {
      setAccionError('No se pudo abrir el comprobante. Verificá que el archivo exista.');
    } finally {
      setComprobanteLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportarInscriptosAprobados(filtroCarrera ? { id_carrera: filtroCarrera } : {}); }
    catch { alert('Error al exportar.'); }
    finally { setExporting(false); }
  };

  const nombreCompleto = (i) =>
    i.apellido && i.nombre ? `${i.apellido}, ${i.nombre}` : i.nombre_completo || '—';

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">Inscriptos</h1>
          <p className="text-sm text-slate">{inscripciones.length} resultado{inscripciones.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleExport} loading={exporting} variant="secondary">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 4-2-2m2 2 2-2M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8M2 6h20" />
          </svg>
          Exportar aprobados
        </Button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select id="filtro-carrera" label="Carrera" value={filtroCarrera}
            onChange={(e) => setFiltroCarrera(e.target.value)}
            options={carreraOptions} placeholder="Todas las carreras" />
          <Select id="filtro-estado" label="Estado de pago" value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            options={[
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Aprobado',  label: 'Aprobado'  },
              { value: 'Rechazado', label: 'Rechazado' }
            ]} placeholder="Todos los estados" />
          <div>
            <label className="form-label">DNI</label>
            <input className="form-input" placeholder="Buscar por DNI..."
              value={filtroDni} onChange={(e) => setFiltroDni(e.target.value)} />
          </div>
        </div>
      </div>

      {loading  && <Spinner label="Cargando inscripciones..." />}
      {!loading && error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
      )}
      {!loading && !error && inscripciones.length === 0 && (
        <div className="card p-10 text-center text-slate">No hay inscripciones que coincidan con los filtros.</div>
      )}

      {/* Tabla */}
      {!loading && !error && inscripciones.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Apellido y nombre</th>
                  <th>DNI</th>
                  <th>Carrera</th>
                  <th>Categoría</th>
                  <th>Estado pago</th>
                  <th>Email notif.</th>
                  <th>Aprobación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((insc) => (
                  <tr key={insc.id}>
                    <td className="bib-number text-sm">#{String(insc.id).padStart(5, '0')}</td>
                    <td className="font-medium">{nombreCompleto(insc)}</td>
                    <td className="font-mono text-sm">{insc.dni}</td>
                    <td className="text-sm">{insc.carrera_nombre}</td>
                    <td className="text-sm">{insc.categoria}</td>
                    <td><Badge estado={insc.estado_pago} /></td>
                    <td>
                      <EmailBadge
                        enviado={insc.email_inscripcion_enviado}
                        fecha={insc.email_inscripcion_fecha}
                        type="inscripcion"
                      />
                    </td>
                    <td>
                      <EmailBadge
                        enviado={insc.email_aprobacion_enviado}
                        fecha={insc.email_aprobacion_fecha}
                        type="aprobacion"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => { setDetalle(insc); setAccionError(''); }}
                        className="text-xs font-semibold text-coral hover:underline"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        title={`Inscripción #${detalle ? String(detalle.id).padStart(5, '0') : ''}`}
        maxWidth="max-w-2xl"
      >
        {detalle && (
          <div className="space-y-5">
            {accionError && (
              <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {accionError}
              </div>
            )}

            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              {[
                ['Apellido',     detalle.apellido   || '—'],
                ['Nombre',       detalle.nombre     || '—'],
                ['DNI',          detalle.dni],
                ['Fecha nac.',   formatearFecha(detalle.fecha_nacimiento)],
                ['Edad',         `${detalle.edad} años`],
                ['Sexo',         detalle.sexo],
                ['Email',        detalle.email      || '—'],
                ['Teléfono',     detalle.telefono   || '—'],
                ['Ciudad',       detalle.ciudad     || '—'],
                ['Carrera',      detalle.carrera_nombre],
                ['Tipo',         TIPO_CARRERA_LABEL[detalle.carrera_tipo] || detalle.carrera_tipo],
                ['Modalidad',    detalle.modalidad_nombre],
                ['Categoría',    detalle.categoria],
                ['Fecha inscr.', formatearFechaHora(detalle.fecha_inscripcion)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-slate">{label}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate">Estado pago</dt>
                <dd className="mt-0.5"><Badge estado={detalle.estado_pago} /></dd>
              </div>
            </dl>

            {/* Indicadores de email */}
            <div className="rounded-lg border border-black/5 bg-sand/50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">
                Notificaciones por email
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate">Confirmación de inscripción</span>
                <EmailBadge
                  enviado={detalle.email_inscripcion_enviado}
                  fecha={detalle.email_inscripcion_fecha}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate">Notificación de aprobación</span>
                <EmailBadge
                  enviado={detalle.email_aprobacion_enviado}
                  fecha={detalle.email_aprobacion_fecha}
                />
              </div>
            </div>

            {/* Comprobante */}
            {detalle.comprobante ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Comprobante</p>
                <button
                  type="button"
                  onClick={() => handleVerComprobante(detalle.id)}
                  disabled={comprobanteLoading}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  {comprobanteLoading ? 'Abriendo...' : 'Ver / descargar comprobante'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-warning">⚠ Sin comprobante cargado.</p>
            )}

            {/* Acciones de pago */}
            <div className="flex flex-wrap gap-3 border-t border-black/5 pt-4">
              {detalle.estado_pago !== 'Aprobado' && (
                <Button onClick={() => handleAccion('aprobar', detalle.id)}
                  loading={accionLoading} disabled={!detalle.comprobante}
                  className="!bg-success hover:!bg-success/80">
                  ✓ Aprobar pago
                </Button>
              )}
              {detalle.estado_pago !== 'Rechazado' && (
                <Button onClick={() => handleAccion('rechazar', detalle.id)}
                  loading={accionLoading} className="!bg-danger hover:!bg-danger/80">
                  ✗ Rechazar pago
                </Button>
              )}
              {detalle.estado_pago !== 'Pendiente' && (
                <Button onClick={() => handleAccion('reabrir', detalle.id)}
                  loading={accionLoading} variant="secondary">
                  ↩ Volver a Pendiente
                </Button>
              )}
            </div>

            {/* Botón Notificar aprobación */}
            {detalle.estado_pago === 'Aprobado' && detalle.email && (
              <div className="border-t border-black/5 pt-4">
                <Button
                  onClick={() => handleNotificar(detalle.id)}
                  loading={notifLoading}
                  disabled={detalle.email_aprobacion_enviado}
                  variant="secondary"
                  className="w-full"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {detalle.email_aprobacion_enviado ? 'Notificación ya enviada' : 'Notificar aprobación por email'}
                </Button>
                {detalle.email_aprobacion_enviado && detalle.email_aprobacion_fecha && (
                  <p className="mt-1 text-center text-xs text-slate">
                    Enviado: {formatearFechaHora(detalle.email_aprobacion_fecha)}
                  </p>
                )}
                {!detalle.email && (
                  <p className="mt-1 text-center text-xs text-warning">
                    Este inscripto no tiene email registrado.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
