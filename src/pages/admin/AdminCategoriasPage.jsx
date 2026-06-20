import { useEffect, useState, useCallback } from 'react';
import {
  getCategorias, createCategoria, updateCategoria,
  deleteCategoria, generarCategoriasEstandar
} from '../../api/categorias.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Toast from '../../components/common/Toast';
import { SEXO_LABEL } from '../../utils/formatters';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino'       },
  { value: 'femenino',  label: 'Femenino'        },
  { value: 'otro',      label: 'Mixto / Libre'   }
];

const FORM_VACIO = { nombre: '', edad_minima: '0', edad_maxima: '120', sexo: 'otro' };

function CategoriaForm({ initial, onSave, onCancel }) {
  const [form, setForm]       = useState(initial || FORM_VACIO);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const hc = (f) => (e) => { setForm((p) => ({ ...p, [f]: e.target.value })); setErrors((p) => ({ ...p, [f]: undefined })); };

  const validar = () => {
    const err = {};
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio';
    if (Number(form.edad_minima) > Number(form.edad_maxima)) err.edad_minima = 'Edad mínima no puede ser mayor a la máxima';
    if (Number(form.edad_minima) < 0) err.edad_minima = 'No puede ser negativa';
    setErrors(err);
    return !Object.keys(err).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaveErr('');
    if (!validar()) return;
    setSaving(true);
    try {
      await onSave({ ...form, edad_minima: Number(form.edad_minima), edad_maxima: Number(form.edad_maxima) });
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {saveErr && <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{saveErr}</div>}
      <Input label="Nombre" id="cat-nombre" required placeholder="Ej: 30-34 (M)"
        value={form.nombre} onChange={hc('nombre')} error={errors.nombre} />
      <Select label="Sexo" id="cat-sexo"
        value={form.sexo} onChange={hc('sexo')} options={SEXO_OPTIONS} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Edad mínima" id="cat-emin" type="number" min="0" max="120"
          value={form.edad_minima} onChange={hc('edad_minima')} error={errors.edad_minima} />
        <Input label="Edad máxima" id="cat-emax" type="number" min="0" max="120"
          value={form.edad_maxima} onChange={hc('edad_maxima')} />
      </div>
      <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar categoría</Button>
      </div>
    </form>
  );
}

const SEXO_COLOR = { masculino: 'bg-navy/10 text-navy', femenino: 'bg-coral/10 text-coral', otro: 'bg-slate/10 text-slate' };

export default function AdminCategoriasPage() {
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [modalCrear,  setModalCrear]  = useState(false);
  const [editando,    setEditando]    = useState(null);
  const [eliminando,  setEliminando]  = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [generando,   setGenerando]   = useState(false);
  const [toast,       setToast]       = useState(null);
  const [filtroSexo,  setFiltroSexo]  = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    getCategorias()
      .then((r) => setCategorias(r.data.data))
      .catch(() => setError('No se pudieron cargar las categorías.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCrear     = async (data) => { await createCategoria(data);               setModalCrear(false); fetch(); };
  const handleActualizar = async (data) => { await updateCategoria(editando.id, data); setEditando(null);    fetch(); };

  const handleEliminar = async () => {
    setDeletingId(eliminando.id);
    try { await deleteCategoria(eliminando.id); setEliminando(null); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'No se pudo eliminar.'); }
    finally { setDeletingId(null); }
  };

  const handleEstandar = async () => {
    setGenerando(true);
    try {
      const r = await generarCategoriasEstandar();
      const n = r.data.data?.length || 0;
      setToast({ message: n > 0 ? `${n} categorías estándar creadas correctamente.` : 'Todas las categorías estándar ya existían.', type: 'success' });
      fetch();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error al generar categorías.', type: 'info' });
    } finally { setGenerando(false); }
  };

  const formInitial = (c) => ({
    nombre: c.nombre || '', sexo: c.sexo || 'otro',
    edad_minima: String(c.edad_minima ?? 0), edad_maxima: String(c.edad_maxima ?? 120)
  });

  const filtradas = filtroSexo ? categorias.filter((c) => c.sexo === filtroSexo) : categorias;

  // Agrupar por sexo para tabla más legible
  const grupos = ['masculino', 'femenino', 'otro'].map((s) => ({
    sexo: s,
    items: filtradas.filter((c) => c.sexo === s)
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">Categorías</h1>
          <p className="text-sm text-slate">{categorias.length} categoría{categorias.length !== 1 ? 's' : ''} definida{categorias.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleEstandar} loading={generando} variant="secondary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generar categorías estándar
          </Button>
          <Button onClick={() => setModalCrear(true)}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Nueva categoría
          </Button>
        </div>
      </div>

      {/* Info sobre uso */}
      <div className="rounded-lg border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-navy">
        <strong>Nota:</strong> las categorías se asignan automáticamente al inscribirse según la edad y el sexo del participante.
        Para asociar categorías a una carrera específica, entrá a <strong>Carreras → Editar</strong>.
      </div>

      {/* Filtro sexo */}
      <div className="flex flex-wrap gap-2">
        {[{ value: '', label: 'Todos' }, { value: 'masculino', label: 'Masculino' }, { value: 'femenino', label: 'Femenino' }, { value: 'otro', label: 'Mixto' }].map((op) => (
          <button key={op.value}
            onClick={() => setFiltroSexo(op.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtroSexo === op.value ? 'bg-navy text-white' : 'bg-white border border-black/10 text-slate hover:border-navy/30'
            }`}>
            {op.label}
          </button>
        ))}
      </div>

      {loading && <Spinner label="Cargando categorías..." />}
      {!loading && error && <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>}
      {!loading && !error && categorias.length === 0 && (
        <div className="card p-10 text-center text-slate">
          No hay categorías. Usá <strong>"Generar categorías estándar"</strong> para crear el conjunto completo, o creá una manualmente.
        </div>
      )}

      {/* Tabla agrupada por sexo */}
      {!loading && !error && grupos.map((grupo) => (
        <div key={grupo.sexo} className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-black/5 px-5 py-3">
            <span className={`badge ${SEXO_COLOR[grupo.sexo]}`}>{SEXO_LABEL[grupo.sexo] || grupo.sexo}</span>
            <span className="text-xs text-slate">{grupo.items.length} categoría{grupo.items.length !== 1 ? 's' : ''}</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Edad mín.</th>
                <th>Edad máx.</th>
                <th>Sexo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupo.items.map((cat) => (
                <tr key={cat.id}>
                  <td className="font-semibold text-navy">{cat.nombre}</td>
                  <td className="text-center font-mono">{cat.edad_minima}</td>
                  <td className="text-center font-mono">{cat.edad_maxima === 120 ? '70+' : cat.edad_maxima}</td>
                  <td><span className={`badge ${SEXO_COLOR[cat.sexo]}`}>{SEXO_LABEL[cat.sexo] || cat.sexo}</span></td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => setEditando(cat)} className="text-xs font-semibold text-coral hover:underline">Editar</button>
                      <button onClick={() => setEliminando(cat)} className="text-xs font-semibold text-danger hover:underline">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Modal crear */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nueva categoría">
        <CategoriaForm onSave={handleCrear} onCancel={() => setModalCrear(false)} />
      </Modal>

      {/* Modal editar */}
      <Modal open={Boolean(editando)} onClose={() => setEditando(null)} title="Editar categoría">
        {editando && <CategoriaForm initial={formInitial(editando)} onSave={handleActualizar} onCancel={() => setEditando(null)} />}
      </Modal>

      {/* Modal eliminar */}
      <Modal open={Boolean(eliminando)} onClose={() => setEliminando(null)} title="Eliminar categoría">
        {eliminando && (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              ¿Eliminar <span className="font-semibold text-navy">{eliminando.nombre}</span>?
              Las inscripciones existentes conservarán el nombre de categoría guardado.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEliminando(null)}>Cancelar</Button>
              <Button onClick={handleEliminar} loading={deletingId === eliminando.id} className="!bg-danger hover:!bg-danger/80">
                Sí, eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
