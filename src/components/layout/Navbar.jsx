import { Link, NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/#carreras', label: 'Carreras' },
  { to: '/inscripcion', label: 'Inscribirme' }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-sand/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-navy">
          <span className="flex h-9 w-auto px-2 items-center justify-center rounded-md bg-navy text-coral text-sm font-display tracking-tight">
            CRONO
          </span>
          <span className="hidden sm:inline">Crono Sports</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition hover:text-coral ${isActive ? 'text-coral' : 'text-navy'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/inscripcion" className="btn-primary !px-5 !py-2 text-sm">
            Inscribirme
          </Link>
        </div>

        <Link to="/inscripcion" className="btn-primary !px-4 !py-2 text-sm sm:hidden">
          Inscribirme
        </Link>
      </nav>
    </header>
  );
}
