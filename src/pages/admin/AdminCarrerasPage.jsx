import { useEffect, useState, useCallback } from 'react';
import { getCarreras, createCarrera, updateCarrera, deleteCarrera } from '../../api/carreras.api';
import { getCategorias, reemplazarCategoriasCarrera } from '../../api/categorias.api';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { formatearFecha, formatearMoneda, TIPO_CARRERA_LABEL, ESTADO_CARRERA_LABEL } from '../../utils/formatters';

const TIPO_OPTIONS = [
  { value: 'running',  label: 'Running'  },
  { value: 'duatlon',  label: 'Duatlón'  },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'triatlon', label: 'Triatlón' }
];

const ESTADO_OPTIONS = [
  { value: 'activa',     label: 'Activa'     },
  { value: 'cerrada',    label: 'Cerrada'    },
  { value: 'finalizada', label: 'Finalizada' }
];

const FORM_VACIO = {
  nombre: '', tipo: 'running', fecha_evento: '', ubicacion: '',
  descripcion: '', cupo_maximo: '', precio_base: '', estado: 'activa',
  imagen_portada_url: '',
  alias: '', cbu: '', whatsapp: '', url_mapa: '', imagen_recorrido_url: ''
};

function CarreraForm({ initial, onSave, onCancel, idCarrera }) {
  const [form, setForm]           = useState(initial || FORM_VACIO);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [catSeleccionadas, setCatSeleccionadas] = useState(initial?.categorias_ids || []);

  useEffect(() => {
    getCategorias().then((r) => setTodasCategorias(r.data.data)).catch(() => {});
  }, []);

  const toggleCategoria = (id) => {
    setCatSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validar = () => {
    const err = {};
    if (!form.nombre.trim())  err.nombre       = 'El nombre es obligatorio';
    if (!form.tipo)           err.tipo         = 'Seleccioná un tipo';
    if (!form.fecha_evento)   err.fecha_evento = 'La fecha es obligatoria';
    if (form.precio_base !== '' && Number(form.precio_base) < 0) err.precio_base = 'Debe ser ≥ 0';
    if (form.cupo_maximo !== '' && Number(form.cupo_maximo) < 0) err.cupo_maximo = 'Debe ser ≥ 0';
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
        precio_base: form.precio_base !== '' ? Number(form.precio_base) : 0,
        cupo_maximo: form.cupo_maximo !== '' ? Number(form.cupo_maximo) : 0,
        categorias_ids: catSeleccionadas
      });
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar la carrera.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {saveError && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{saveError}</div>
      )}

      {/* Información básica */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Información básica</legend>

        <Input label="Nombre" id="nombre" required
          value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Tipo" id="tipo" required
            value={form.tipo} onChange={handleChange('tipo')} options={TIPO_OPTIONS} error={errors.tipo} />
          <Select label="Estado" id="estado"
            value={form.estado} onChange={handleChange('estado')} options={ESTADO_OPTIONS} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Fecha del evento" id="fecha_evento" type="date" required
            value={form.fecha_evento} onChange={handleChange('fecha_evento')} error={errors.fecha_evento} />
          <Input label="Ubicación" id="ubicacion" placeholder="Ej: Santiago del Estero"
            value={form.ubicacion} onChange={handleChange('ubicacion')} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Cupo máximo" id="cupo_maximo" type="number" min="0"
            placeholder="0 = ilimitado"
            value={form.cupo_maximo} onChange={handleChange('cupo_maximo')} error={errors.cupo_maximo} />
          <Input label="Precio base (ARS)" id="precio_base" type="number" min="0" step="0.01"
            value={form.precio_base} onChange={handleChange('precio_base')} error={errors.precio_base} />
        </div>

        <div>
          <label className="form-label">Descripción</label>
          <textarea
            className="form-input min-h-[72px] resize-y"
            placeholder="Descripción breve del evento..."
            value={form.descripcion}
            onChange={handleChange('descripcion')}
          />
        </div>
      </fieldset>

      {/* Datos de pago */}
      <fieldset className="space-y-3 rounded-lg border border-coral/20 bg-coral/5 p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-coral px-1">Datos de pago</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Alias" id="alias" placeholder="Ej: cronosports.sde"
            value={form.alias} onChange={handleChange('alias')}
            hint="Alias de la cuenta para transferencias" />
          <Input label="CBU" id="cbu" placeholder="22 dígitos"
            value={form.cbu} onChange={handleChange('cbu')} />
        </div>
        <Input label="WhatsApp del organizador" id="whatsapp"
          placeholder="Ej: 5493856000000 (con código de país, sin +)"
          value={form.whatsapp} onChange={handleChange('whatsapp')}
          hint="Número internacional sin espacios ni caracteres especiales" />
      </fieldset>

      {/* Multimedia */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Multimedia y mapa</legend>
        <Input label="URL imagen principal" id="imagen_portada_url" type="url" placeholder="https://..."
          value={form.imagen_portada_url} onChange={handleChange('imagen_portada_url')} />
        <Input label="URL imagen de recorrido" id="imagen_recorrido_url" type="url" placeholder="https://..."
          value={form.imagen_recorrido_url} onChange={handleChange('imagen_recorrido_url')} />
        <Input label="URL Google Maps (embed)" id="url_mapa" type="url"
          placeholder="https://www.google.com/maps/embed?pb=..."
          value={form.url_mapa} onChange={handleChange('url_mapa')}
          hint="Usá la URL de Google Maps > Compartir > Insertar un mapa > src='...'" />
      </fieldset>

      {/* Categorías por carrera */}
      <fieldset className="space-y-3 rounded-lg border border-navy/10 bg-navy/5 p-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-navy px-1">
          Categorías disponibles para esta carrera
        </legend>
        <p className="text-xs text-slate">
          Seleccioná las categorías habilitadas. Si no seleccionás ninguna, se usarán todas las globales.
        </p>
        {todasCategorias.length === 0 ? (
          <p className="text-xs text-warning">No hay categorías creadas. Creá categorías desde el menú "Categorías".</p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {['masculino','femenino','otro'].map((sexo) => {
              const grupo = todasCategorias.filter((c) => c.sexo === sexo);
              if (!grupo.length) return null;
              return (
                <div key={sexo}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate mb-1 capitalize">{sexo}</p>
                  {grupo.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={catSeleccionadas.includes(cat.id)}
                        onChange={() => toggleCategoria(cat.id)}
                        className="accent-coral"
                      />
                      {cat.nombre}
                      <span className="text-xs text-slate">({cat.edad_minima}–{cat.edad_maxima === 120 ? '70+' : cat.edad_maxima})</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setCatSeleccionadas(todasCategorias.map(c => c.id))}
            className="text-xs font-semibold text-coral hover:underline">Seleccionar todas</button>
          <span className="text-slate text-xs">·</span>
          <button type="button" onClick={() => setCatSeleccionadas([])}
            className="text-xs font-semibold text-slate hover:underline">Limpiar</button>
        </div>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar carrera</Button>
      </div>
    </form>
  );
}

const TIPO_COLOR = {
  running:  'bg-coral/10 text-coral',
  duatlon:  'bg-success/10 text-success',
  ciclismo: 'bg-navy/10 text-navy'
};

export default function AdminCarrerasPage() {
  const [carreras, setCarreras]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando]     = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [archivando, setArchivando] = useState(null);
  const [archivandoId, setArchivandoId] = useState(null);

  const fetchCarreras = useCallback(() => {
    setLoading(true);
    getCarreras()
      .then((res) => setCarreras(res.data.data))
      .catch(() => setError('No se pudieron cargar las carreras.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCarreras(); }, [fetchCarreras]);

  const handleCrear    = async (data) => { await createCarrera(data);               setModalCrear(false); fetchCarreras(); };
  const handleActualizar = async (data) => { await updateCarrera(editando.id, data); setEditando(null);    fetchCarreras(); };

  const handleEliminar = async () => {
    setDeletingId(eliminando.id);
    try {
      await deleteCarrera(eliminando.id);
      setEliminando(null);
      fetchCarreras();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar la carrera.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchivar = async () => {
    setArchivandoId(archivando.id);
    try {
      await axiosClient.patch(`/carreras/${archivando.id}/archivar`);
      setArchivando(null);
      fetchCarreras();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo archivar la carrera.');
    } finally { setArchivandoId(null); }
  };

  const [categoriasIniciales, setCategoriasIniciales] = useState([]);

  const cargarCategoriasCarrera = async (idCarrera) => {
    try {
      const r = await import('../../api/categorias.api').then(m => m.getCategoriasByCarrera(idCarrera));
      setCategoriasIniciales(r.data.data.map(c => c.id));
    } catch { setCategoriasIniciales([]); }
  };

  const formInitial = (c) => ({
    nombre:               c.nombre              || '',
    tipo:                 c.tipo                || 'running',
    fecha_evento:         c.fecha_evento        ? c.fecha_evento.split('T')[0] : '',
    ubicacion:            c.ubicacion           || '',
    descripcion:          c.descripcion         || '',
    cupo_maximo:          c.cupo_maximo         ?? '',
    precio_base:          c.precio_base         ?? '',
    estado:               c.estado              || 'activa',
    imagen_portada_url:   c.imagen_portada_url  || '',
    alias:                c.alias               || '',
    cbu:                  c.cbu                 || '',
    whatsapp:             c.whatsapp            || '',
    url_mapa:             c.url_mapa            || '',
    imagen_recorrido_url: c.imagen_recorrido_url || '',
    categorias_ids:       categoriasIniciales
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy">Carreras</h1>
          <p className="text-sm text-slate">{carreras.length} carrera{carreras.length !== 1 ? 's' : ''} registrada{carreras.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalCrear(true)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Nueva carrera
        </Button>
      </div>

      {loading && <Spinner label="Cargando carreras..." />}
      {!loading && error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
      )}
      {!loading && !error && carreras.length === 0 && (
        <div className="card p-10 text-center text-slate">
          No hay carreras registradas.{' '}
          <button onClick={() => setModalCrear(true)} className="font-semibold text-coral hover:underline">
            Crear la primera.
          </button>
        </div>
      )}

      {!loading && !error && carreras.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {carreras.map((c) => (
            <div key={c.id} className="card flex flex-col p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <span className={`badge ${TIPO_COLOR[c.tipo] || 'bg-slate/10 text-slate'}`}>
                  {TIPO_CARRERA_LABEL[c.tipo]}
                </span>
                <span className="text-xs text-slate font-mono">{formatearFecha(c.fecha_evento)}</span>
              </div>

              <h3 className="mt-3 font-display text-lg text-navy">{c.nombre}</h3>
              {c.ubicacion && <p className="text-xs text-slate mt-0.5">{c.ubicacion}</p>}

              {/* Indicadores de pago configurado */}
              <div className="mt-2 flex flex-wrap gap-1">
                {c.alias    && <span className="badge bg-success/10 text-success text-[10px]">Alias ✓</span>}
                {c.cbu      && <span className="badge bg-success/10 text-success text-[10px]">CBU ✓</span>}
                {c.whatsapp && <span className="badge bg-[#25D366]/10 text-[#1ebe5d] text-[10px]">WhatsApp ✓</span>}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate">Estado</dt>
                  <dd className="font-semibold">{ESTADO_CARRERA_LABEL[c.estado]}</dd>
                </div>
                <div>
                  <dt className="text-slate">Precio base</dt>
                  <dd className="font-semibold font-mono">{formatearMoneda(c.precio_base)}</dd>
                </div>
                <div>
                  <dt className="text-slate">Cupo máx.</dt>
                  <dd className="font-semibold">{c.cupo_maximo || 'Ilimitado'}</dd>
                </div>
              </dl>

              <div className="mt-auto flex gap-2 border-t border-black/5 pt-4">
                <button
                  onClick={() => { setEditando(c); cargarCategoriasCarrera(c.id); }}
                  className="flex-1 rounded-md border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy/5"
                >
                  Editar
                </button>
                <button
                  onClick={() => setArchivando(c)}
                  className="flex-1 rounded-md border border-slate/20 px-3 py-1.5 text-xs font-semibold text-slate transition hover:bg-slate/5"
                >
                  Archivar
                </button>
                <button
                  onClick={() => setEliminando(c)}
                  className="flex-1 rounded-md border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/5"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nueva carrera" maxWidth="max-w-2xl">
        <CarreraForm onSave={handleCrear} onCancel={() => setModalCrear(false)} />
      </Modal>

      <Modal open={Boolean(editando)} onClose={() => setEditando(null)} title="Editar carrera" maxWidth="max-w-2xl">
        {editando && (
          <CarreraForm initial={formInitial(editando)} onSave={handleActualizar} onCancel={() => setEditando(null)} />
        )}
      </Modal>

      {/* Modal archivar */}
      <Modal open={Boolean(archivando)} onClose={() => setArchivando(null)} title="Archivar carrera">
        {archivando && (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              ¿Archivar <span className="font-semibold text-navy">{archivando.nombre}</span>?
              La carrera se ocultará del listado público pero <strong>todos los inscriptos se conservan</strong>.
              Podrás restaurarla desde <Link to="/admin/carreras-archivadas" className="text-coral hover:underline">Carreras archivadas</Link>.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setArchivando(null)}>Cancelar</Button>
              <Button onClick={handleArchivar} loading={archivandoId === archivando.id}
                className="!bg-slate hover:!bg-slate/80">
                Sí, archivar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(eliminando)} onClose={() => setEliminando(null)} title="Eliminar carrera">
        {eliminando && (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              ¿Seguro que querés eliminar{' '}
              <span className="font-semibold text-navy">{eliminando.nombre}</span>?
              Se eliminarán también todas sus modalidades.
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
