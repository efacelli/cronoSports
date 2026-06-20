import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCarreras, updateCarrera } from '../../api/carreras.api';
import axiosClient from '../../api/axiosClient';
import { exportarInscriptosAprobados } from '../../api/exportacion.api';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Toast from '../../components/common/Toast';
import { formatearFecha, formatearMoneda, TIPO_CARRERA_LABEL } from '../../utils/formatters';

const ESTADO_COLOR = {
  archivada: 'bg-slate/10 text-slate',
  eliminada: 'bg-danger/10 text-danger'
};

export default function AdminCarrerasArchivadasPage() {
  const [carreras,   setCarreras]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState(null);
  const [actionId,   setActionId]   = useState(null);
  const [exporting,  setExporting]  = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    // Llama al endpoint admin/archivadas
    axiosClient.get('/carreras/admin/archivadas')
      .then((r) => setCarreras(r.data.data))
      .catch(() => setError('No se pudieron cargar las carreras archivadas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRestaurar = async (id, nombre) => {
    setActionId(id);
    try {
      await axiosClient.patch(`/carreras/${id}/restaurar`);
      setToast({ message: `"${nombre}" fue restaurada como activa.`, type: 'success' });
      fetch();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error al restaurar.', type: 'info' });
    } finally { setActionId(null); }
  };

  const handleExportar = async (id, nombre) => {
    setExporting(id);
    try {
      await exportarInscriptosAprobados({ id_carrera: id });
    } catch {
      setToast({ message: `Error al exportar inscriptos de "${nombre}".`, type: 'info' });
    } finally { setExporting(null); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy">Carreras archivadas</h1>
          <p className="text-sm text-slate">
            Historial de carreras eliminadas o archivadas. Los inscriptos se conservan siempre.
          </p>
        </div>
        <Link to="/admin/carreras" className="btn-secondary text-sm">
          ← Volver a carreras activas
        </Link>
      </div>

      {/* Aviso */}
      <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
        <strong>Datos protegidos:</strong> ningún inscripto fue eliminado. Podés restaurar cualquier carrera
        o exportar su información histórica en cualquier momento.
      </div>

      {loading && <Spinner label="Cargando historial..." />}
      {!loading && error && <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>}
      {!loading && !error && carreras.length === 0 && (
        <div className="card p-10 text-center text-slate">
          No hay carreras archivadas ni eliminadas.
        </div>
      )}

      {!loading && !error && carreras.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Tipo</th>
                  <th>Fecha evento</th>
                  <th>Ubicación</th>
                  <th>Precio base</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carreras.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold text-navy">{c.nombre}</td>
                    <td className="capitalize text-sm">{TIPO_CARRERA_LABEL[c.tipo] || c.tipo}</td>
                    <td className="font-mono text-sm">{formatearFecha(c.fecha_evento)}</td>
                    <td className="text-sm text-slate">{c.ubicacion || '—'}</td>
                    <td className="font-mono text-sm">{formatearMoneda(c.precio_base)}</td>
                    <td>
                      <span className={`badge ${ESTADO_COLOR[c.estado] || 'bg-slate/10 text-slate'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleRestaurar(c.id, c.nombre)}
                          disabled={actionId === c.id}
                          className="text-xs font-semibold text-success hover:underline disabled:opacity-50"
                        >
                          {actionId === c.id ? 'Restaurando...' : 'Restaurar'}
                        </button>
                        <Link
                          to={`/admin/inscripciones?id_carrera=${c.id}`}
                          className="text-xs font-semibold text-coral hover:underline"
                        >
                          Ver inscriptos
                        </Link>
                        <button
                          onClick={() => handleExportar(c.id, c.nombre)}
                          disabled={exporting === c.id}
                          className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
                        >
                          {exporting === c.id ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
