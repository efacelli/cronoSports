import { useEffect, useState, useCallback } from 'react';
import { getCarreras } from '../../api/carreras.api';
import {
  getModalidadesByCarrera,
  createModalidad,
  updateModalidad,
  deleteModalidad
} from '../../api/modalidades.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { SEXO_LABEL, formatearMoneda } from '../../utils/formatters';

const SEXO_OPTIONS = [
  { value: 'otro', label: 'Mixto / Libre (cualquier sexo)' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' }
];

const FORM_VACIO = {
  id_carrera: '', nombre: '', distancia: '', sexo: 'otro',
  edad_minima: '0', edad_maxima: '120', precio_extra: '0'
};

function ModalidadForm({ initial, carreraFija, carreraOptions, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { ...FORM_VACIO, id_carrera: carreraFija || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validar = () => {
    const err = {};
    if (!form.id_carrera) err.id_carrera = 'Seleccioná una carrera';
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio';
    if (Number(form.edad_minima) > Number(form.edad_maxima))
      err.edad_minima = 'La edad mínima no puede ser mayor a la máxima';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    if (!validar()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        edad_minima: Number(form.edad_minima),
        edad_maxima: Number(form.edad_maxima),
        precio_extra: Number(form.precio_extra)
      });
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar la modalidad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {saveError && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{saveError}</div>
      )}

      {!carreraFija && (
        <Select
          label="Carrera"
          id="id_carrera"
          required
          value={form.id_carrera}
          onChange={handleChange('id_carrera')}
          options={carreraOptions}
          error={errors.id_carrera}
          placeholder="Seleccioná una carrera"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre de la modalidad" id="nombre" required placeholder="Ej: 10K Master Femenino" value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />
        <Input label="Distancia" id="distancia" placeholder="Ej: 10K, 21K, Bici 20K + 5K" value={form.distancia} onChange={handleChange('distancia')} />
      </div>

      <Select label="Sexo" id="sexo" value={form.sexo} onChange={handleChange('sexo')} options={SEXO_OPTIONS} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Edad mínima" id="edad_minima" type="number" min="0" max="120" value={form.edad_minima} onChange={handleChange('edad_minima')} error={errors.edad_minima} />
        <Input label="Edad máxima" id="edad_maxima" type="number" min="0" max="120" value={form.edad_maxima} onChange={handleChange('edad_maxima')} />
        <Input label="Precio extra (ARS)" id="precio_extra" type="number" min="0" step="0.01" value={form.precio_extra} onChange={handleChange('precio_extra')} hint="Adicional al precio base de la carrera" />
      </div>

      <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar modalidad</Button>
      </div>
    </form>
  );
}

export default function AdminModalidadesPage() {
  const [carreras, setCarreras] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('');
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getCarreras()
      .then((res) => {
        setCarreras(res.data.data);
        if (res.data.data.length > 0) setCarreraSeleccionada(String(res.data.data[0].id));
      })
      .catch(() => {});
  }, []);

  const fetchModalidades = useCallback(() => {
    if (!carreraSeleccionada) return;
    setLoading(true);
    setError('');
    getModalidadesByCarrera(carreraSeleccionada)
      .then((res) => setModalidades(res.data.data))
      .catch(() => setError('No se pudieron cargar las modalidades.'))
      .finally(() => setLoading(false));
  }, [carreraSeleccionada]);

  useEffect(() => { fetchModalidades(); }, [fetchModalidades]);

  const carreraOptions = carreras.map((c) => ({ value: c.id, label: c.nombre }));

  const handleCrear = async (data) => {
    await createModalidad({ ...data, id_carrera: Number(carreraSeleccionada) });
    setModalCrear(false);
    fetchModalidades();
  };

  const handleActualizar = async (data) => {
    await updateModalidad(editando.id, data);
    setEditando(null);
    fetchModalidades();
  };

  const handleEliminar = async () => {
    setDeletingId(eliminando.id);
    try {
      await deleteModalidad(eliminando.id);
      setEliminando(null);
      fetchModalidades();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar la modalidad.');
    } finally {
      setDeletingId(null);
    }
  };

  const formFromModalidad = (m) => ({
    id_carrera: String(m.id_carrera),
    nombre: m.nombre || '',
    distancia: m.distancia || '',
    sexo: m.sexo || 'otro',
    edad_minima: String(m.edad_minima ?? 0),
    edad_maxima: String(m.edad_maxima ?? 120),
    precio_extra: String(m.precio_extra ?? 0)
  });

  const carreraNombre = carreras.find((c) => String(c.id) === carreraSeleccionada)?.nombre || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">Modalidades</h1>
          <p className="text-sm text-slate">Configurá las categorías por carrera.</p>
        </div>
        <Button onClick={() => setModalCrear(true)} disabled={!carreraSeleccionada}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Nueva modalidad
        </Button>
      </div>

      {/* Selector de carrera */}
      <div className="card p-4">
        <Select
          label="Seleccioná una carrera"
          id="carrera-selector"
          value={carreraSeleccionada}
          onChange={(e) => setCarreraSeleccionada(e.target.value)}
          options={carreraOptions}
          placeholder="Elegí una carrera..."
        />
      </div>

      {!carreraSeleccionada && (
        <div className="card p-10 text-center text-slate">
          Seleccioná una carrera para ver y gestionar sus modalidades.
        </div>
      )}

      {carreraSeleccionada && loading && <Spinner label="Cargando modalidades..." />}
      {carreraSeleccionada && !loading && error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
      )}

      {carreraSeleccionada && !loading && !error && modalidades.length === 0 && (
        <div className="card p-10 text-center text-slate">
          <p>No hay modalidades para <span className="font-semibold text-navy">{carreraNombre}</span>.</p>
          <button onClick={() => setModalCrear(true)} className="mt-2 font-semibold text-coral hover:underline">
            Crear la primera modalidad
          </button>
        </div>
      )}

      {carreraSeleccionada && !loading && !error && modalidades.length > 0 && (
        <div className="card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Distancia</th>
                <th>Sexo</th>
                <th>Edad mín.</th>
                <th>Edad máx.</th>
                <th>Precio extra</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modalidades.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold text-navy">{m.nombre}</td>
                  <td>{m.distancia || '—'}</td>
                  <td>{SEXO_LABEL[m.sexo] || m.sexo}</td>
                  <td className="text-center font-mono">{m.edad_minima}</td>
                  <td className="text-center font-mono">{m.edad_maxima}</td>
                  <td className="font-mono">{Number(m.precio_extra) > 0 ? `+ ${formatearMoneda(m.precio_extra)}` : '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditando(m)}
                        className="text-xs font-semibold text-coral hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setEliminando(m)}
                        className="text-xs font-semibold text-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nueva modalidad" maxWidth="max-w-xl">
        <ModalidadForm
          carreraFija={carreraSeleccionada}
          carreraOptions={carreraOptions}
          onSave={handleCrear}
          onCancel={() => setModalCrear(false)}
        />
      </Modal>

      {/* Modal editar */}
      <Modal open={Boolean(editando)} onClose={() => setEditando(null)} title="Editar modalidad" maxWidth="max-w-xl">
        {editando && (
          <ModalidadForm
            initial={formFromModalidad(editando)}
            carreraFija={carreraSeleccionada}
            carreraOptions={carreraOptions}
            onSave={handleActualizar}
            onCancel={() => setEditando(null)}
          />
        )}
      </Modal>

      {/* Modal confirmar eliminacion */}
      <Modal open={Boolean(eliminando)} onClose={() => setEliminando(null)} title="Eliminar modalidad">
        {eliminando && (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              ¿Eliminar la modalidad <span className="font-semibold text-navy">{eliminando.nombre}</span>?
              Las inscripciones existentes que referencian esta modalidad no serán eliminadas.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEliminando(null)}>Cancelar</Button>
              <Button
                onClick={handleEliminar}
                loading={deletingId === eliminando.id}
                className="!bg-danger hover:!bg-danger/80"
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
