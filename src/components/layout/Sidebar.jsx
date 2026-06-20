import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin/dashboard',           label: 'Dashboard',   icon: 'chart'   },
  { to: '/admin/inscripciones',       label: 'Inscriptos',  icon: 'list'    },
  { to: '/admin/carreras',            label: 'Carreras',    icon: 'flag'    },
  { to: '/admin/carreras-archivadas', label: 'Archivadas',  icon: 'archive' },
  { to: '/admin/modalidades',         label: 'Modalidades', icon: 'layers'  },
  { to: '/admin/categorias',          label: 'Categorías',  icon: 'tag'     }
];

const icons = {
  chart:   <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />,
  list:    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  flag:    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4m0 0h11l-2 3 2 3H5" />,
  archive: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />,
  layers:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />,
  tag:     <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3zM6 6h.008v.008H6V6z" />
};

export default function Sidebar() {
  const { admin, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-navy text-sand">
      <div className="flex items-center gap-2 px-6 py-6 font-display text-lg">
        <span className="flex h-9 px-2 items-center justify-center rounded-md bg-coral text-navy text-sm tracking-tight">
          CRONO
        </span>
        <span className="text-base">Panel admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-coral text-white' : 'text-sand/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {icons[link.icon]}
            </svg>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sand/10 px-6 py-4">
        <p className="text-xs text-sand/50">Sesión iniciada como</p>
        <p className="truncate text-sm font-semibold">{admin?.nombre}</p>
        <p className="truncate text-xs text-sand/50">{admin?.email}</p>
        <button
          type="button" onClick={logout}
          className="mt-3 w-full rounded-md border border-sand/20 px-3 py-2 text-sm font-medium text-sand/80 transition hover:bg-white/5 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
