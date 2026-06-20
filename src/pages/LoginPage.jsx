import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validar = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    if (!form.password)     newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validar()) return;
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Credenciales incorrectas. Verificá tu email y contraseña.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy">
      {/* Panel izquierdo */}
      <div className="hidden flex-col justify-between p-12 lg:flex lg:w-1/2">
        <div className="flex items-center gap-2 font-display text-xl text-sand">
          <span className="flex h-9 px-2 items-center justify-center rounded-md bg-coral text-navy text-sm tracking-tight">
            CRONO
          </span>
          Crono Sports
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-coral">Panel administrativo</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-sand">
            Gestioná carreras,<br />inscripciones y pagos.
          </h1>
          <p className="mt-4 text-sand/60">
            Acceso exclusivo para organizadores y administradores de Crono Sports.
          </p>
        </div>

        <p className="text-xs text-sand/30">
          © {new Date().getFullYear()} Crono Sports · Santiago del Estero, AR
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 items-center justify-center p-6 lg:bg-sand">
        <div className="w-full max-w-md">
          {/* ← Volver al inicio */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-navy lg:text-navy"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>

          <div className="lg:hidden mb-6 flex items-center gap-2 font-display text-xl text-sand">
            <span className="flex h-9 px-2 items-center justify-center rounded-md bg-coral text-navy text-sm tracking-tight">
              CRONO
            </span>
            Crono Sports
          </div>

          <div className="card p-8">
            <h2 className="font-display text-2xl text-navy">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate">Ingresá con tu cuenta de administrador.</p>

            {submitError && (
              <div className="mt-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <Input
                label="Email" id="email" type="email" required
                placeholder="admin@cronosports.com"
                value={form.email} onChange={handleChange('email')}
                error={errors.email} autoComplete="email"
              />
              <Input
                label="Contraseña" id="password" type="password" required
                placeholder="••••••••"
                value={form.password} onChange={handleChange('password')}
                error={errors.password} autoComplete="current-password"
              />
              <Button type="submit" loading={submitting} className="w-full">
                Ingresar al panel
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
