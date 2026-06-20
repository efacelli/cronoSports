import { Link } from 'react-router-dom';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1600&q=80';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-sand">
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Corredores en la largada de una carrera"
          className="h-full w-full object-cover opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20" />
        <div className="absolute inset-0 bg-noise" />
      </div>

      <div className="container-page relative py-24 sm:py-32 lg:py-40">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-4 py-1 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-coral">
          Edición 2026 · Cupos limitados
        </p>

        <h1 className="max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
          Corré, pedaleá, sumá.
          <span className="block text-coral">Crono Sports 2026.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-sand/80 sm:text-lg">
          Running, duatlón y ciclismo. Tres disciplinas,
          un mismo circuito y categorías para todas las edades. Asegurá tu
          cupo, presentá tu comprobante y nos vemos en la largada.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/inscripcion" className="btn-primary text-base">
            Inscribirme ahora
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a href="#carreras" className="btn-secondary !border-sand/40 !text-sand text-base hover:!bg-sand hover:!text-navy">
            Ver carreras disponibles
          </a>
        </div>

        <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-sand/10 pt-8 font-mono">
          <div>
            <dt className="text-xs uppercase tracking-widest text-sand/50">Disciplinas</dt>
            <dd className="mt-1 text-2xl font-bold text-coral">3</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-sand/50">Categorías</dt>
            <dd className="mt-1 text-2xl font-bold text-coral">+8</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-sand/50">Cupos totales</dt>
            <dd className="mt-1 text-2xl font-bold text-coral">1800</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
