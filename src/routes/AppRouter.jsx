import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout  from '../components/layout/PublicLayout';
import AdminLayout   from '../components/layout/AdminLayout';
import PrivateRoute  from './PrivateRoute';

import HomePage          from '../pages/HomePage';
import InscripcionPage   from '../pages/InscripcionPage';
import ConfirmacionPage  from '../pages/ConfirmacionPage';
import LoginPage         from '../pages/LoginPage';

import AdminDashboardPage         from '../pages/admin/AdminDashboardPage';
import AdminInscripcionesPage     from '../pages/admin/AdminInscripcionesPage';
import AdminCarrerasPage          from '../pages/admin/AdminCarrerasPage';
import AdminCarrerasArchivadasPage from '../pages/admin/AdminCarrerasArchivadasPage';
import AdminModalidadesPage       from '../pages/admin/AdminModalidadesPage';
import AdminCategoriasPage        from '../pages/admin/AdminCategoriasPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/"            element={<HomePage />} />
          <Route path="/inscripcion" element={<InscripcionPage />} />
          <Route path="/confirmacion" element={<ConfirmacionPage />} />
        </Route>

        {/* Login admin */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Panel admin protegido */}
        <Route
          path="/admin"
          element={<PrivateRoute><AdminLayout /></PrivateRoute>}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"           element={<AdminDashboardPage />} />
          <Route path="inscripciones"       element={<AdminInscripcionesPage />} />
          <Route path="carreras"            element={<AdminCarrerasPage />} />
          <Route path="carreras-archivadas" element={<AdminCarrerasArchivadasPage />} />
          <Route path="modalidades"         element={<AdminModalidadesPage />} />
          <Route path="categorias"          element={<AdminCategoriasPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
