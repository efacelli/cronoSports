import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

/**
 * Protege rutas que requieren autenticacion de administrador.
 * - Si el token todavia esta validandose, muestra un spinner.
 * - Si no hay sesion, redirige a /admin/login guardando la ruta intentada.
 * - Si hay sesion, renderiza la ruta solicitada.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
