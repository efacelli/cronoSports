import { useEffect, useState } from 'react';
import { getCarreras } from '../../api/carreras.api';
import Spinner from '../common/Spinner';
import CarreraCard from './CarreraCard';

/**
 * Seccion "Carreras": muestra informacion general del evento
 * y la lista de carreras activas obtenidas desde la API.
 */
export default function EventInfo() {
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCarreras({ estado: 'activa' })
      .then((res) => setCarreras(res.data.data))
      .catch(() => setError('No pudimos cargar las carreras disponibles. Intentá nuevamente más tarde.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="carreras" className="bg-sand py-20">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-coral">Calendario 2026</p>
          <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">
            Tres formatos, una misma fiesta del deporte
          </h2>
          <p className="mt-4 text-slate">
            Elegí la carrera que más se adapte a tu nivel y objetivo. Cada
            evento define sus propias modalidades por edad y sexo: al
            inscribirte, te asignamos automáticamente la categoría que te
            corresponde según tu fecha de nacimiento.
          </p>
        </div>

        <div className="mt-12">
          {loading && <Spinner label="Cargando carreras..." />}

          {!loading && error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          {!loading && !error && carreras.length === 0 && (
            <div className="rounded-md border border-black/5 bg-white p-8 text-center text-slate">
              No hay carreras activas en este momento. Volvé a consultar pronto.
            </div>
          )}

          {!loading && !error && carreras.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {carreras.map((carrera) => (
                <CarreraCard key={carrera.id} carrera={carrera} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
