import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy text-sand">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-lg">
            <span className="flex h-9 px-2 items-center justify-center rounded-md bg-coral text-navy text-sm tracking-tight">
              CRONO
            </span>
            Crono Sports
          </div>
          <p className="mt-3 text-sm text-sand/70">
            Organizamos carreras de running, duatlón y ciclismo.
            Cupos limitados en cada edición.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-sand/60">Navegación</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-coral transition">Inicio</Link></li>
            <li><Link to="/inscripcion" className="hover:text-coral transition">Formulario de inscripción</Link></li>
            <li><Link to="/admin/login" className="hover:text-coral transition">Acceso administradores</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-sand/60">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm text-sand/80">
            <li>cronosport.arg@gmail.com</li>
            <li>Santiago del Estero, AR</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand/10 py-4 text-center text-xs text-sand/50">
        © {new Date().getFullYear()} Crono Sports. Todos los derechos reservados.
      </div>
    </footer>
  );
}
