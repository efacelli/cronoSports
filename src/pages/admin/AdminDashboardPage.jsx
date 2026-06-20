import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../../api/dashboard.api';
import { exportarInscriptosAprobados } from '../../api/exportacion.api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';

// ─── Paleta que coincide con el diseño general ────────────────────────────────
const PALETTE = ['#FF5A3C', '#10243E', '#3FA66B', '#E0A526', '#6B7785', '#D6452C', '#9AABBF', '#F5EFE4'];

// ─── Helpers de formato ───────────────────────────────────────────────────────
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = '#FF5A3C', icon }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      {icon && (
        <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: accent + '18' }}>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
            {icon}
          </svg>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
        <p className="mt-0.5 font-mono text-3xl font-bold" style={{ color: accent }}>{value ?? '—'}</p>
        {sub && <p className="mt-0.5 text-xs text-slate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Gráfico de barras horizontal (SVG puro) ──────────────────────────────────
function BarChart({ data, labelKey, valueKey, colorKey, title, height = 240 }) {
  if (!data || data.length === 0) return <EmptyChart title={title} />;

  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const BAR_HEIGHT = 28;
  const BAR_GAP = 10;
  const LABEL_W = 140;
  const VALUE_W = 36;
  const CHART_W = 420;
  const svgH = data.length * (BAR_HEIGHT + BAR_GAP) + 20;

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display text-base text-navy">{title}</h3>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${LABEL_W + CHART_W + VALUE_W + 16} ${svgH}`} style={{ minWidth: 320 }}>
          {data.map((item, i) => {
            const y = i * (BAR_HEIGHT + BAR_GAP) + 4;
            const barW = Math.max(4, Math.round((item[valueKey] / max) * CHART_W));
            const color = colorKey ? item[colorKey] : PALETTE[i % PALETTE.length];
            return (
              <g key={item[labelKey]}>
                <text x={LABEL_W - 8} y={y + BAR_HEIGHT / 2 + 4} textAnchor="end"
                  fontSize="11" fill="#6B7785" fontFamily="Inter, sans-serif">
                  {String(item[labelKey]).length > 18 ? String(item[labelKey]).slice(0, 17) + '…' : item[labelKey]}
                </text>
                {/* Track */}
                <rect x={LABEL_W} y={y} width={CHART_W} height={BAR_HEIGHT} rx="4" fill="#F5EFE4" />
                {/* Bar */}
                <rect x={LABEL_W} y={y} width={barW} height={BAR_HEIGHT} rx="4" fill={color} />
                {/* Value */}
                <text x={LABEL_W + barW + 6} y={y + BAR_HEIGHT / 2 + 4}
                  fontSize="11" fontWeight="700" fill="#10243E" fontFamily="'JetBrains Mono', monospace">
                  {item[valueKey]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Gráfico de dona (SVG puro) ───────────────────────────────────────────────
function DonutChart({ data, labelKey, valueKey, title }) {
  if (!data || data.length === 0) return <EmptyChart title={title} />;

  const total = data.reduce((s, d) => s + d[valueKey], 0);
  if (total === 0) return <EmptyChart title={title} />;

  const R = 70, cx = 100, cy = 90, strokeW = 28;
  const circumference = 2 * Math.PI * R;
  let accumulated = 0;

  const slices = data.map((item, i) => {
    const pct = item[valueKey] / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = accumulated * 360 - 90;
    accumulated += pct;
    return { ...item, dash, gap, rotation, color: PALETTE[i % PALETTE.length], pct };
  });

  return (
    <div className="card p-5">
      <h3 className="mb-2 font-display text-base text-navy">{title}</h3>
      <div className="flex flex-wrap items-center gap-6">
        <svg width="200" height="180" viewBox="0 0 200 180" className="shrink-0">
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={R}
              fill="none" stroke={s.color} strokeWidth={strokeW}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={0}
              transform={`rotate(${s.rotation} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          ))}
          {/* Centro */}
          <circle cx={cx} cy={cy} r={R - strokeW / 2 - 2} fill="white" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#10243E" fontFamily="'JetBrains Mono',monospace">
            {total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6B7785" fontFamily="Inter,sans-serif">
            total
          </text>
        </svg>

        <div className="space-y-2 flex-1">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 text-slate">{capitalize(String(s[labelKey]))}</span>
              <span className="font-mono font-semibold text-navy">{s[valueKey]}</span>
              <span className="w-10 text-right text-xs text-slate">
                {(s.pct * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Gráfico de línea — evolución diaria (SVG puro) ──────────────────────────
function LineChart({ data, title }) {
  if (!data || data.length === 0) return <EmptyChart title={title} />;

  const W = 540, H = 160, PAD = { top: 16, right: 16, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.total), 1);

  const xScale = (i) => PAD.left + (i / (data.length - 1 || 1)) * chartW;
  const yScale = (v) => PAD.top + chartH - (v / maxVal) * chartH;

  const pointsTotal = data.map((d, i) => `${xScale(i)},${yScale(d.total)}`).join(' ');
  const pointsApr   = data.map((d, i) => `${xScale(i)},${yScale(d.aprobadas || 0)}`).join(' ');

  // Area fill bajo la línea total
  const areaTotal = `M${xScale(0)},${yScale(data[0].total)} ` +
    data.slice(1).map((d, i) => `L${xScale(i + 1)},${yScale(d.total)}`).join(' ') +
    ` L${xScale(data.length - 1)},${PAD.top + chartH} L${xScale(0)},${PAD.top + chartH} Z`;

  // Ticks eje Y
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // Selecciona hasta 6 labels para el eje X sin amontonarse
  const step = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-base text-navy">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-slate">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: '#FF5A3C', opacity: 0.25 }} /> Total
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-success" /> Aprobados
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 300 }}>
          {/* Grilla horizontal */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={yScale(v)} y2={yScale(v)}
                stroke="#E2DDD6" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD.left - 4} y={yScale(v) + 4} textAnchor="end"
                fontSize="9" fill="#6B7785" fontFamily="'JetBrains Mono',monospace">{v}</text>
            </g>
          ))}

          {/* Area total */}
          <path d={areaTotal} fill="#FF5A3C" opacity="0.12" />
          {/* Línea total */}
          <polyline points={pointsTotal} fill="none" stroke="#FF5A3C" strokeWidth="2" strokeLinejoin="round" />
          {/* Línea aprobados */}
          <polyline points={pointsApr} fill="none" stroke="#3FA66B" strokeWidth="2"
            strokeLinejoin="round" strokeDasharray="4 3" />

          {/* Puntos en total */}
          {data.map((d, i) => (
            <circle key={i} cx={xScale(i)} cy={yScale(d.total)} r="3" fill="white" stroke="#FF5A3C" strokeWidth="2" />
          ))}

          {/* Eje X labels */}
          {xLabels.map((d, i) => {
            const idx = data.indexOf(d);
            const fecha = new Date(d.fecha);
            const label = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
            return (
              <text key={i} x={xScale(idx)} y={H - 4} textAnchor="middle"
                fontSize="9" fill="#6B7785" fontFamily="Inter,sans-serif">{label}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Gráfico de barras agrupadas por carrera ──────────────────────────────────
function CarreraGroupedBars({ data, title }) {
  if (!data || data.length === 0) return <EmptyChart title={title} />;

  const BAR_W = 14, GAP = 4, GROUP_GAP = 24;
  const groupW = BAR_W * 3 + GAP * 2;
  const totalW = data.length * (groupW + GROUP_GAP) + GROUP_GAP;
  const H = 180, PAD_B = 50, PAD_T = 16, PAD_L = 36;
  const chartH = H - PAD_B - PAD_T;
  const maxVal = Math.max(...data.map(d => Math.max(d.aprobadas, d.pendientes, d.rechazadas)), 1);

  const yScale = v => PAD_T + chartH - (v / maxVal) * chartH;
  const barColors = ['#3FA66B', '#E0A526', '#D6452C'];
  const barKeys   = ['aprobadas', 'pendientes', 'rechazadas'];
  const barLabels = ['Aprobados', 'Pendientes', 'Rechazados'];

  return (
    <div className="card p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base text-navy">{title}</h3>
        <div className="flex gap-4 text-xs text-slate">
          {barLabels.map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: barColors[i] }} />
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${PAD_L + totalW} ${H}`} style={{ minWidth: 280 }}>
          {/* Grilla */}
          {[0, Math.round(maxVal / 2), maxVal].map(v => (
            <g key={v}>
              <line x1={PAD_L} x2={PAD_L + totalW} y1={yScale(v)} y2={yScale(v)}
                stroke="#E2DDD6" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD_L - 4} y={yScale(v) + 4} textAnchor="end"
                fontSize="9" fill="#6B7785" fontFamily="'JetBrains Mono',monospace">{v}</text>
            </g>
          ))}

          {data.map((carrera, gi) => {
            const gx = PAD_L + GROUP_GAP + gi * (groupW + GROUP_GAP);
            const nombre = carrera.carrera_nombre.length > 12
              ? carrera.carrera_nombre.slice(0, 11) + '…'
              : carrera.carrera_nombre;
            return (
              <g key={carrera.id_carrera}>
                {barKeys.map((key, bi) => {
                  const val = carrera[key] || 0;
                  const bx = gx + bi * (BAR_W + GAP);
                  const bh = Math.max(2, (val / maxVal) * chartH);
                  const by = PAD_T + chartH - bh;
                  return (
                    <g key={key}>
                      <rect x={bx} y={by} width={BAR_W} height={bh} rx="3" fill={barColors[bi]} />
                      {val > 0 && (
                        <text x={bx + BAR_W / 2} y={by - 3} textAnchor="middle"
                          fontSize="8" fontWeight="700" fill={barColors[bi]}
                          fontFamily="'JetBrains Mono',monospace">{val}</text>
                      )}
                    </g>
                  );
                })}
                <text x={gx + groupW / 2} y={H - 6} textAnchor="middle"
                  fontSize="9" fill="#6B7785" fontFamily="Inter,sans-serif">{nombre}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function EmptyChart({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-8 text-slate">
      <svg className="h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
      </svg>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs">Sin datos disponibles aún.</p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [resumen, setResumen]         = useState(null);
  const [porCarrera, setPorCarrera]   = useState([]);
  const [porCategoria, setPorCategoria] = useState([]);
  const [porSexo, setPorSexo]         = useState([]);
  const [porModalidad, setPorModalidad] = useState([]);
  const [evolucion, setEvolucion]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardApi.getResumen(),
      dashboardApi.getInscripcionesPorCarrera(),
      dashboardApi.getInscripcionesPorCategoria(),
      dashboardApi.getInscripcionesPorSexo(),
      dashboardApi.getInscripcionesPorModalidad(),
      dashboardApi.getEvolucionInscripciones()
    ])
      .then(([r, c, cat, s, m, e]) => {
        setResumen(r.data.data);
        setPorCarrera(c.data.data);
        setPorCategoria(cat.data.data);
        setPorSexo(s.data.data);
        setPorModalidad(m.data.data);
        setEvolucion(e.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportarInscriptosAprobados();
    } catch {
      alert('Error al exportar. Verificá tu conexión e intentá nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spinner label="Cargando dashboard..." />;

  // Tasa de aprobacion
  const tasaAprobacion = resumen && resumen.total_inscripciones > 0
    ? Math.round((resumen.pagos_aprobados / resumen.total_inscripciones) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">Dashboard</h1>
          <p className="text-sm text-slate">Estadísticas en tiempo real de inscripciones y pagos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} loading={exporting} variant="secondary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 4-2-2m2 2 2-2M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8M2 6h20" />
            </svg>
            Exportar Excel (6 hojas)
          </Button>
          <Link to="/admin/inscripciones?estado_pago=Pendiente"
            className="btn-primary text-sm">
            Revisar pagos pendientes
            {resumen?.pagos_pendientes > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                {resumen.pagos_pendientes}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {resumen && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total inscriptos"
            value={resumen.total_inscripciones}
            accent="#10243E"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />}
          />
          <StatCard
            label="Aprobados"
            value={resumen.pagos_aprobados}
            accent="#3FA66B"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
          <StatCard
            label="Pendientes"
            value={resumen.pagos_pendientes}
            accent="#E0A526"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
          <StatCard
            label="Rechazados"
            value={resumen.pagos_rechazados}
            accent="#D6452C"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />}
          />
          <StatCard
            label="Tasa de aprobación"
            value={`${tasaAprobacion}%`}
            accent="#FF5A3C"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />}
          />
          <StatCard
            label="Carreras activas"
            value={resumen.carreras_activas}
            sub={`de ${resumen.total_carreras} total`}
            accent="#6B7785"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />}
          />
        </div>
      )}

      {/* ── Barra de progreso aprobación ── */}
      {resumen && resumen.total_inscripciones > 0 && (
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-navy">Estado general de pagos</span>
            <span className="text-xs text-slate">{resumen.total_inscripciones} inscripciones totales</span>
          </div>
          <div className="flex h-5 overflow-hidden rounded-full bg-black/5">
            <div
              className="flex items-center justify-center bg-success text-white text-xs font-bold transition-all"
              style={{ width: `${(resumen.pagos_aprobados / resumen.total_inscripciones) * 100}%` }}
            >
              {resumen.pagos_aprobados > 0 && resumen.pagos_aprobados}
            </div>
            <div
              className="flex items-center justify-center bg-warning text-white text-xs font-bold"
              style={{ width: `${(resumen.pagos_pendientes / resumen.total_inscripciones) * 100}%` }}
            >
              {resumen.pagos_pendientes > 0 && resumen.pagos_pendientes}
            </div>
            <div
              className="flex items-center justify-center bg-danger text-white text-xs font-bold"
              style={{ width: `${(resumen.pagos_rechazados / resumen.total_inscripciones) * 100}%` }}
            >
              {resumen.pagos_rechazados > 0 && resumen.pagos_rechazados}
            </div>
          </div>
          <div className="mt-2 flex gap-6 text-xs text-slate">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success"/> Aprobados</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-warning"/> Pendientes</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-danger"/> Rechazados</span>
          </div>
        </div>
      )}

      {/* ── Evolución temporal ── */}
      <LineChart data={evolucion} title="Evolución de inscripciones (últimos 30 días)" />

      {/* ── Barras por carrera ── */}
      <CarreraGroupedBars data={porCarrera} title="Inscripciones por carrera" />

      {/* ── Donuts: sexo y categoría ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DonutChart
          data={porSexo}
          labelKey="sexo"
          valueKey="total"
          title="Distribución por sexo"
        />
        <DonutChart
          data={porCategoria.slice(0, 7)}
          labelKey="categoria"
          valueKey="total"
          title="Inscriptos por categoría (top 7)"
        />
      </div>

      {/* ── Barras horizontales por modalidad ── */}
      <BarChart
        data={porModalidad.slice(0, 10).map(m => ({
          ...m,
          label: m.modalidad + (m.distancia ? ` (${m.distancia})` : '')
        }))}
        labelKey="label"
        valueKey="total"
        title="Inscriptos por modalidad (top 10)"
      />

      {/* ── Tabla resumen por carrera ── */}
      {porCarrera.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-black/5 px-5 py-4">
            <h3 className="font-display text-base text-navy">Detalle por carrera</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Tipo</th>
                  <th>Cupo máx.</th>
                  <th>Total</th>
                  <th>Aprobados</th>
                  <th>Pendientes</th>
                  <th>Rechazados</th>
                  <th>% Aprobación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {porCarrera.map(c => {
                  const pct = c.total_inscripciones > 0
                    ? Math.round((c.aprobadas / c.total_inscripciones) * 100)
                    : 0;
                  return (
                    <tr key={c.id_carrera}>
                      <td className="font-semibold text-navy">{c.carrera_nombre}</td>
                      <td className="capitalize">{c.carrera_tipo}</td>
                      <td className="text-center font-mono">{c.cupo_maximo || '∞'}</td>
                      <td className="text-center font-mono font-bold">{c.total_inscripciones}</td>
                      <td className="text-center font-mono font-bold text-success">{c.aprobadas}</td>
                      <td className="text-center font-mono text-warning">{c.pendientes}</td>
                      <td className="text-center font-mono text-danger">{c.rechazadas}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono font-bold text-navy w-8">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <Link to={`/admin/inscripciones?id_carrera=${c.id_carrera}`}
                          className="text-xs font-semibold text-coral hover:underline">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
