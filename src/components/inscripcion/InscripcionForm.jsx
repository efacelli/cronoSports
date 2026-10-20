import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCarreras } from '../../api/carreras.api';
import { getModalidadesByCarrera } from '../../api/modalidades.api';
import { crearInscripcion, subirComprobante } from '../../api/inscripciones.api';
import { calcularEdad, calcularModalidadSugerida } from '../../utils/calcularEdad';
import { TIPO_CARRERA_LABEL } from '../../utils/formatters';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import ComprobanteUpload from './ComprobanteUpload';
import CategoriaPreview from './CategoriaPreview';
import Toast from '../common/Toast';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro / Prefiero no decir' }
];

const INITIAL_FORM = {
  id_carrera: '', id_modalidad: '', apellido: '', nombre: '', dni: '',
  fecha_nacimiento: '', sexo: '', email: '', telefono: '', ciudad: '',
  observaciones: '', aceptar_condiciones: false,
  // Campos opcionales por carrera
  talle: '', club: '', tel_emergencia: '', obra_social: '',
  grupo_sanguineo: '', fecha_examen_medico: '', link_ironman: ''
};

// ─── Botón copiar con feedback ──────────────────────────────────────────────
function CopyButton({ value, onCopied }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback para navegadores sin clipboard API
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition
        ${copied
          ? 'bg-success/15 text-success'
          : 'bg-navy/5 text-navy hover:bg-navy/10'
        }`}
      title="Copiar"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

// ─── Panel de datos de pago ──────────────────────────────────────────────────
function DatosPago({ carrera, modalidadSeleccionada, onCopied }) {
  if (!carrera) return null;

  const { alias, cbu, whatsapp, precio_base } = carrera;
  if (!alias && !cbu && !whatsapp) return null;

  // Monto = precio_base de la carrera + precio_extra de la modalidad
  const precioExtra = modalidadSeleccionada ? Number(modalidadSeleccionada.precio_extra || 0) : 0;
  const montoTotal = Number(precio_base || 0) + precioExtra;
  const montoFmt = montoTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const waUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Tengo una consulta sobre las inscripciones de ' + carrera.nombre)}`
    : null;

  return (
    <div className="rounded-xl border-2 border-coral/60 bg-coral/10 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy flex items-center gap-2">
          <svg className="h-4 w-4 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Datos para la transferencia
        </p>
        {montoTotal > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate uppercase tracking-wide">Monto a transferir</p>
            <p className="font-mono font-bold text-lg text-coral">{montoFmt}</p>
            {precioExtra > 0 && (
              <p className="text-[11px] text-slate">
                Base {Number(precio_base).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                {' '}+ extra {precioExtra.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {alias && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-4 py-3">
            <div>
              <p className="text-xs text-slate uppercase tracking-wide">Alias</p>
              <p className="font-mono font-semibold text-navy">{alias}</p>
            </div>
            <CopyButton value={alias} onCopied={onCopied} />
          </div>
        )}

        {cbu && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-4 py-3">
            <div>
              <p className="text-xs text-slate uppercase tracking-wide">CBU</p>
              <p className="font-mono font-semibold text-navy text-sm break-all">{cbu}</p>
            </div>
            <CopyButton value={cbu} onCopied={onCopied} />
          </div>
        )}
      </div>

      {waUrl && (
        <div className="pt-1">
          <p className="text-xs text-slate mb-2">¿Tenés dudas? Contactate con el organizador</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d] active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Escribir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Panel lateral — Mapa ────────────────────────────────────────────────────
function MapaCarrera({ carrera }) {
  if (!carrera?.url_mapa) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl bg-navy/5 text-slate text-sm p-6 text-center">
        <div>
          <svg className="mx-auto mb-2 h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <p>Sin mapa configurado para esta carrera.</p>
        </div>
      </div>
    );
  }

  // Convierte URL normal de Google Maps a URL embebida si es necesario
  let src = carrera.url_mapa;
  if (src.includes('google.com/maps') && !src.includes('/embed')) {
    src = `https://maps.google.com/maps?q=${encodeURIComponent(carrera.ubicacion || carrera.nombre)}&output=embed`;
  }

  return (
    <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-black/5 shadow-sm">
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ minHeight: 280, border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa de ${carrera.nombre}`}
      />
    </div>
  );
}

// ─── Panel lateral — Recorrido ───────────────────────────────────────────────
function RecorridoCarrera({ carrera }) {
  if (!carrera?.imagen_recorrido_url) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl bg-navy/5 text-slate text-sm p-6 text-center">
        <div>
          <svg className="mx-auto mb-2 h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p>Sin imagen de recorrido configurada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-black/5 shadow-sm">
      <img
        src={carrera.imagen_recorrido_url}
        alt={`Recorrido de ${carrera.nombre}`}
        className="h-full w-full object-contain bg-white"
        style={{ minHeight: 280 }}
      />
    </div>
  );
}

const TERMINOS_Y_CONDICIONES = `La Actividad para la que te registrarte el evento deportivo 602K Atletas Extremos, o 301k Atletas Extremos y/o 602 o 301 equipos. Es un evento de extremada exigencia desde el Punto de Vista Físico y conlleva: riesgos de molestias, Lesiones e INCLUSO la muerte. Deberá Estar Seguro de que su estado Físico le permite Participar en el Evento mencionado sin poner en riesgo su salud ni su vida. No REALIZAMOS Pruebas de salud ni de Estado Físico a las Personas las Registradas. Si bien tomamos Medidas para que el Evento se desarrolle de la forma más segura posible, no Podemos ELIMINAR todos los Riesgos y peligros para los Participantes y los espectadores y por lo Tanto, Usted participa o presencia el Evento bajo su Responsabilidad Propia.

1. ACEPTACION DE RIESGOS. DESDE LA ACEPTACION DE SU REGISTRO Y SU PARTICIPACIÓN EN EL EVENTO, USTED ASUME TODOS LOS RIESGOS Y RESPONSABILIDADES DE CUALQUIER TIPO COMO MOLESTIAS, ENFERMEDAD, LESION O ACCIDENTE QUE SUFRA O PUEDA SUFRIR DURANTE SU PREPARACIÓN PARA EL EVENTO, DURANTE EL PROPIO EVENTO, MIENTRAS ESTE EN LA UBICACIÓN DEL EVENTO Y EN LOS TRASLADOS AL EVENTO O DESDE ESTE. RECONOCE QUE PARTICIPAR EN EL EVENTO PUEDE SER PELIGROSO Y PARTICIPA EN EL BAJO SU ENTERA RESPONSABILIDAD Y MANIFIESTA ESTAR APTO PARA ELLO DESDE EL PUNTO DE VISTA MÉDICO Y SE ENCUENTRA DEBIDAMENTE ENTRENADO. LE RECOMENDAMOS QUE CONSULTE A SU MÉDICO ANTES DE PARTICIPAR EN EL EVENTO. ES RESPONSABILIDAD SUYA COMPROBAR Y VERIFICAR QUE SE ENCUENTRA EN TODO MOMENTO EN CONDICIONES MÉDICAS Y FISICAS ADECUADAS PARA PARTICIPAR EN LAS ACTIVIDADES RELACIONADAS CON EL EVENTO. RECONOCE Y ACEPTA QUE EL EVENTO SE PODRA REALIZAR EN CARRETERAS E INSTALACIONES PÚBLICAS, QUE ESTARAN ABIERTAS AL PÚBLICO DURANTE EL EVENTO Y EN LAS QUE PUEDEN PRODUCIRSE SITUACIONES DE PELIGRO. ASI MISMO, RECONOCE Y ACEPTA QUE LA PARTICIPACIÓN EN EL EVENTO PUEDE CON LLEVAR DETERMINADOS RIESGOS Y PELIGROS INHERENTES QUE NO PUEDEN ELIMINARSE POR COMPLETO, DESDE MOLESTIAS MENORES HASTA LESIONES MUY GRAVES, INCLUIDA LA DISCAPACIDAD PERMANENTE Y LA MUERTE. USTED RECONOCE QUE ES CONSCIENTE DE TODOS LOS RIESGOS ASOCIADOS CON LA PARTICIPACIÓN EN EL EVENTO Y LOS ASUME, INCLUIDOS, ENTRE OTROS, LOS RIESGOS DE LESIONES PERMANENTES O MUERTE COMO CONCECUENCIA DE CAIDAS, OBSTACULOS, CONTACTOS CON OTROS PARTICIPANTES, ACTOS U OMISIONES DE OTROS PARTICIPANTES, FENOMENO METEREOLOGICO, EL TRÁFICO Y EL ESTADO DE LAS CARRETERAS. Usted se compromete a Cumplir y obedecer TODAS las normas y advertencias señalizadas, y Seguir TODAS LAS INSTRUCCIONES Que le dé el organizador del evento y a RESPETAR TODAS LAS Decisiones de Jueces del Evento Sobre su incapacidad para participar o continuar en el evento o asistir a en el, en Condiciones de Seguridad inadecuadas. Usted reconoce y Acepta mantener un Comportamiento apropiado Y que cumpla TODAS LAS Leyes aplicables MIENTRAS Participe en el Evento o Asista. ESTO INCLUYE, en general el respeto a las Personas, equipos, instalaciones o bienes. Usted Acepta Que los Jueces del Evento podrán expulsarle, sin tener derecho a reembolso.

2. Usted Manifiesta y Garantiza Que se encuentra en buen estado Físico, y es Capaz de Participar en Condiciones de Seguridad en el Evento y no tiene ningún Problema Médico Que agrave los Riesgos de su Participación en el Evento. Usted Acepta Recibir Tratamiento Médico y Ser trasladado para recibirlo en Caso de Que Sufra Una lesión y reconoce Que Este Acuerdo y Exención de Responsabilidad Cubre también responsabilidad derivada o Relacionada Con El Tratamiento Médico y el transporte facilitados en Caso de Emergencia y / o Lesiones. Usted reconoce Que es Posible Que no Haya Asistencia Médica disponible en forma inmediata y, en Caso de Haberla, Usted ASUME La Responsabilidad por Todos Los Gastos Médicos Que se produzcan Como consecuencia de su Participación en el Evento. Usted reconoce y Acepta Que es responsable de ocuparse de Sus Objetos Personales Durante el Evento Y Que el organizador del evento NO aceptarán Responsabilidad Alguna por daños y/o perdidas de objetos personales que se pierdan o resulte dañado o robado en el Evento. Usted reconoce y Acepta Que El organizador del Evento se reserva el Derecho a cancelar el Evento en Caso de fenómenos meteorológicos (Incluidos, Entre Otros, Calor, tornados, terremotos, incendios, Tormentas, rayos e Inundaciones), accidentes, u otros que afecten a la Seguridad de los Participantes y / o espectadores del evento. En Caso de cancelación por Los motivos citados o por Otro motivo, no se le reembolsará el importe abonado.

4. DESCARGO Y EXENCIÓN DE RESPONSABILIDAD. POR EL PRESENTE DOCUMENTO, Y MEDIANTE SU FIRMA, EXIME Y DESCARGA DE RESPONSABILIDAD Y SE COMPROMETE A NO DEMANDAR Y A EXONERAR PARA SIEMPRE A LOS ORGANIZADORES Y AL RESTO DE PERSONAS ASOCIADAS CON EL EVENTO, POR TODAS SUS RESPONSABILIDADES, DEMANDAS, ACCIONES JUDICIALES O SOLICITUDES DE INDEMNIZACION POR DANOS QUE PUDIERA PRESENTAR CONTRA ELLOS O EXIGIRLES COMO CONSECUENCIA EN RELACIÓN CON SU REGISTRO Y / O PARTICIPACIÓN EN EL EVENTO, INCLUIDAS ENTRE OTRAS, LAS RESPONSABILIDADES, DEMANDAS, ACCIONES O SOLICITUDES DE INDEMNIZACION POR DANOS CAUSADAS POR NEGLIGENCIAS DE LAS PARTES CITADAS (INCLUIDO CUALQUIER INTENTO DE RESCATE NEGLIGENTE), ACCIONES U OMISIONES DE ESAS PARTES O CUALQUIER OTRA CAUSA. LOS ORGANIZADORES DEL EVENTO NO SERÁ RESPONSABLE ANTE USTED DE LOS DANOS DIRECTOS O INDIRECTOS, ACCESORIOS, EMERGENTES O PUNITIVOS, INCLUIDOS, A MODO DE EJEMPLO, DANOS POR LUCRO CESANTE, PERDIDA DE DATOS U OTRAS PERDIDAS INTANGIBLES (INCLUSO SI SE HA INFORMADO A LOS ORGANIZADORES DE LA POSIBILIDAD DE QUE SE PRODUSCAN DICHOS DANOS).

7. UTILIZACIÓN DE LA IMAGEN. Usted otorga al organizador del Evento Permiso irrevocable para grabar su voz y fotografiarle en Relación con el Evento. Asimismo, autoriza al organizador del Evento a utilizar SUS FOTOGRAFÍAS, Voz e Imagen en conjunto con el Evento, en DIFERENTES formatos, incluidas Versiones editadas, A Través de medios, Incluidos, Entre Otros, la retransmisión de audio y / o video por Internet, radiodifusión, cable, transmisiones POR SATELITE y Medios desconocidos en Este Momento, en Todo El Mundo PARA CUALQUIER Finalidad legítima.

8. ACEPTACIÓN. AL ACEPTAR EL PRESENTE ACUERDO Y EXENCIÓN DE RESPONSABILIDAD, USTED AFIRMA QUE LO HA LEIDO Y COMPRENDE TODOS SUS Términos y Condiciones. RECONOCE QUE Entiende y RENUNCIA A DERECHOS SUSTANCIALES, INCLUIDO EL DERECHO A DEMANDAR. RECONOCE QUE USTED PRESTA SU CONSENTIMIENTO A ESTE ACUERDO.`;


// ─── Formulario principal ────────────────────────────────────────────────────
export default function InscripcionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const carreraPreseleccionada = searchParams.get('carrera') || '';

  const [carreras, setCarreras] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [modalidades, setModalidades] = useState([]);
  const [loadingModalidades, setLoadingModalidades] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM, id_carrera: carreraPreseleccionada });
  const [comprobante, setComprobante] = useState(null);
  const [certMedico, setCertMedico] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState(null);
  const [showTerminos, setShowTerminos] = useState(false);
  const [terminosLeidos, setTerminosLeidos] = useState(false);

  useEffect(() => {
    getCarreras({ estado: 'activa' })
      .then((res) => setCarreras(res.data.data))
      .catch(() => setSubmitError('No se pudieron cargar las carreras disponibles.'))
      .finally(() => setLoadingCarreras(false));
  }, []);

  // Carga modalidades cuando cambia la carrera y resetea la selección
  useEffect(() => {
    if (!form.id_carrera) { setModalidades([]); return; }
    setLoadingModalidades(true);
    setForm((prev) => ({ ...prev, id_modalidad: '' }));
    getModalidadesByCarrera(form.id_carrera)
      .then((res) => setModalidades(res.data.data))
      .catch(() => setModalidades([]))
      .finally(() => setLoadingModalidades(false));
  }, [form.id_carrera]);

  const carreraSeleccionada = useMemo(
    () => carreras.find((c) => String(c.id) === String(form.id_carrera)) || null,
    [carreras, form.id_carrera]
  );


  const edad = useMemo(() => calcularEdad(form.fecha_nacimiento), [form.fecha_nacimiento]);

  // Modalidad seleccionada manualmente por el usuario
  const modalidadSeleccionada = useMemo(
    () => modalidades.find((m) => String(m.id) === String(form.id_modalidad)) || null,
    [modalidades, form.id_modalidad]
  );

  // Modalidades compatibles con edad y sexo (para sugerir)
  const modalidadesCompatibles = useMemo(
    () => modalidades.filter((m) => {
      if (!edad || !form.sexo) return true; // muestra todas si no hay datos aún
      const sexoOk = m.sexo === 'otro' || m.sexo === form.sexo;
      const edadOk = edad >= m.edad_minima && edad <= m.edad_maxima;
      return sexoOk && edadOk;
    }),
    [modalidades, edad, form.sexo]
  );

  const modalidadSugerida = useMemo(
    () => modalidadSeleccionada || calcularModalidadSugerida(modalidades, edad, form.sexo),
    [modalidadSeleccionada, modalidades, edad, form.sexo]
  );

  const carreraOptions = useMemo(
    () => carreras.map((c) => ({
      value: c.id,
      label: `${c.nombre} (${TIPO_CARRERA_LABEL[c.tipo] || c.tipo})`
    })),
    [carreras]
  );

  const handleChange = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCopied = useCallback(() => {
    setToast({
      message: 'No te olvides de guardar el comprobante de transferencia para completar tu inscripción.',
      type: 'warning'
    });
  }, []);

  const validar = () => {
    const err = {};
    if (!form.id_carrera) err.id_carrera = 'Seleccioná una carrera';
    if (!form.id_modalidad) err.id_modalidad = 'Seleccioná una modalidad';
    if (!form.apellido.trim()) err.apellido = 'Ingresá tu apellido';
    if (!form.nombre.trim()) err.nombre = 'Ingresá tu nombre';
    if (!form.dni.trim()) err.dni = 'Ingresá tu DNI';
    else if (!/^[0-9A-Za-z.-]{5,20}$/.test(form.dni.trim()))
      err.dni = 'Formato de DNI inválido';
    if (!form.fecha_nacimiento) err.fecha_nacimiento = 'Ingresá tu fecha de nacimiento';
    else if (new Date(form.fecha_nacimiento) > new Date())
      err.fecha_nacimiento = 'La fecha no puede ser futura';
    if (!form.sexo) err.sexo = 'Seleccioná una opción';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = 'Formato de email inválido';
    if (!comprobante) err.comprobante = 'Debés adjuntar el comprobante de pago';

    if (!form.aceptar_condiciones) err.aceptar_condiciones = 'Debés aceptar las condiciones para continuar';

    if (carreraSeleccionada?.campo_link_ironman) {
      const es602 = form.id_modalidad &&
        modalidades.find(m => String(m.id) === String(form.id_modalidad))?.nombre?.includes('602');
      if (es602 && !form.link_ironman.trim()) {
        err.link_ironman = 'El link del último Ironman es obligatorio para la modalidad 602';
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validar()) {
      setToast({ message: 'Revisá los campos marcados en rojo antes de continuar.', type: 'info' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return;
    }
    setSubmitting(true);
    try {
      const res = await crearInscripcion({
        id_carrera: Number(form.id_carrera),
        id_modalidad: Number(form.id_modalidad),
        apellido: form.apellido.trim(),
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        observaciones: form.observaciones.trim() || undefined,
        talle: form.talle || undefined,
        club: form.club.trim() || undefined,
        tel_emergencia: form.tel_emergencia.trim() || undefined,
        obra_social: form.obra_social.trim() || undefined,
        grupo_sanguineo: form.grupo_sanguineo || undefined,
        fecha_examen_medico: form.fecha_examen_medico || undefined,
        link_ironman: form.link_ironman.trim() || undefined,
      });

      const inscripcion = res.data.data;
      await subirComprobante(inscripcion.id, comprobante, certMedico || undefined);

      navigate('/confirmacion', {
        state: {
          inscripcion: {
            ...inscripcion,
            carrera_nombre: carreraSeleccionada?.nombre
          }
        }
      });
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Ocurrió un error al registrar tu inscripción. Intentá nuevamente.';
      setSubmitError(mensaje);
      setToast({ message: mensaje, type: 'info' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } finally {
      setSubmitting(false);
    }
  };

  const tieneInfoCarrera = Boolean(carreraSeleccionada);

  // ── Formulario central ──────────────────────────────────────────────────────
  const formulario = (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {submitError && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {submitError}
        </div>
      )}

      <Select
        label="Carrera"
        id="id_carrera"
        required
        value={form.id_carrera}
        onChange={handleChange('id_carrera')}
        options={carreraOptions}
        error={errors.id_carrera}
        placeholder={loadingCarreras ? 'Cargando carreras...' : 'Seleccioná una carrera'}
        disabled={loadingCarreras}
      />

      {/* Selector de modalidad — debajo de carrera */}
      {form.id_carrera && (
        <div>
          <label className="form-label">
            Modalidad <span className="text-coral">*</span>
          </label>
          {loadingModalidades ? (
            <div className="form-input text-slate text-sm">Cargando modalidades...</div>
          ) : modalidades.length === 0 ? (
            <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              Esta carrera no tiene modalidades configuradas aún.
            </div>
          ) : (
            <select
              id="id_modalidad"
              className={`form-input ${errors.id_modalidad ? 'form-input-error' : ''}`}
              value={form.id_modalidad}
              onChange={handleChange('id_modalidad')}
            >
              <option value="">Seleccioná una modalidad...</option>
              {modalidades.map((m) => {
                const esCompatible = !edad || !form.sexo ||
                  ((m.sexo === 'otro' || m.sexo === form.sexo) &&
                    edad >= m.edad_minima && edad <= m.edad_maxima);
                return (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                    {m.distancia ? ` — ${m.distancia}` : ''}
                    {!esCompatible ? ' ⚠ (fuera de rango)' : ''}
                  </option>
                );
              })}
            </select>
          )}
          {errors.id_modalidad && <p className="form-error">{errors.id_modalidad}</p>}
        </div>
      )}

      {/* Fecha especial para Atletas Extremos */}
      {carreraSeleccionada?.nombre === 'Atletas Extremos' && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-navy">
          <p className="font-semibold mb-1">📅 Fechas del evento:</p>
          <p>30 de abril, 1 y 2 de mayo de 2027</p>
        </div>
      )}


      {/* Info de pago dinámica — debajo de modalidad */}
      {carreraSeleccionada && (
        <DatosPago
          carrera={carreraSeleccionada}
          modalidadSeleccionada={modalidadSeleccionada}
          onCopied={handleCopied}
        />
      )}

      {/* Apellido y Nombre — campos separados */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Apellido"
          id="apellido"
          required
          placeholder="Ej: Pérez"
          value={form.apellido}
          onChange={handleChange('apellido')}
          error={errors.apellido}
        />
        <Input
          label="Nombre"
          id="nombre"
          required
          placeholder="Ej: Juan Carlos"
          value={form.nombre}
          onChange={handleChange('nombre')}
          error={errors.nombre}
        />
      </div>

      <Input
        label="DNI"
        id="dni"
        required
        placeholder="Ej: 30123456"
        value={form.dni}
        onChange={handleChange('dni')}
        error={errors.dni}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Fecha de nacimiento"
          id="fecha_nacimiento"
          type="date"
          required
          max={new Date().toISOString().split('T')[0]}
          value={form.fecha_nacimiento}
          onChange={handleChange('fecha_nacimiento')}
          error={errors.fecha_nacimiento}
        />
        <Select
          label="Sexo"
          id="sexo"
          required
          value={form.sexo}
          onChange={handleChange('sexo')}
          options={SEXO_OPTIONS}
          error={errors.sexo}
          placeholder="Seleccioná una opción"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          id="email"
          required
          type="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
        />
        <Input
          label="Teléfono"
          id="telefono"
          required
          type="tel"
          placeholder="Ej: 3856 123456"
          value={form.telefono}
          onChange={handleChange('telefono')}
          error={errors.telefono}
        />
      </div>

      <Input
        label="Ciudad"
        id="ciudad"
        required
        placeholder="Ej: La Banda"
        value={form.ciudad}
        onChange={handleChange('ciudad')}
        error={errors.ciudad}
      />

      <CategoriaPreview
        edad={edad}
        modalidad={modalidadSugerida}
        sexo={form.sexo}
        sinModalidades={!form.id_carrera}
      />

      {/* Campos opcionales según configuración de la carrera */}
      {carreraSeleccionada?.campo_talle && (
        <div>
          <label className="form-label">Talle de remera <span className="text-coral">*</span></label>
          <select id="talle" className={`form-input ${errors.talle ? 'form-input-error' : ''}`}
            value={form.talle} onChange={handleChange('talle')}>
            <option value="">Seleccioná un talle...</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.talle && <p className="form-error">{errors.talle}</p>}
        </div>
      )}
      {carreraSeleccionada?.campo_club && (
        <Input label="Equipo o club" id="club" required
          placeholder="Ej: Club Atlético Santiago" value={form.club}
          onChange={handleChange('club')} error={errors.club} />
      )}
      {carreraSeleccionada?.campo_tel_emergencia && (
        <Input label="Teléfono de emergencia" id="tel_emergencia" type="tel" required
          placeholder="Ej: 3856 123456" value={form.tel_emergencia}
          onChange={handleChange('tel_emergencia')} error={errors.tel_emergencia} />
      )}
      {carreraSeleccionada?.campo_obra_social && (
        <Input label="Obra social" id="obra_social" required
          placeholder="Ej: OSDE, Swiss Medical, PAMI" value={form.obra_social}
          onChange={handleChange('obra_social')} error={errors.obra_social} />
      )}
      {carreraSeleccionada?.campo_grupo_sanguineo && (
        <div>
          <label className="form-label">Grupo sanguíneo <span className="text-coral">*</span></label>
          <select id="grupo_sanguineo" className={`form-input ${errors.grupo_sanguineo ? 'form-input-error' : ''}`}
            value={form.grupo_sanguineo} onChange={handleChange('grupo_sanguineo')}>
            <option value="">Seleccioná...</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.grupo_sanguineo && <p className="form-error">{errors.grupo_sanguineo}</p>}
        </div>
      )}
      {carreraSeleccionada?.campo_examen_medico && (
        <Input label="Fecha último examen médico" id="fecha_examen_medico" type="date" required
          max={new Date().toISOString().split('T')[0]}
          value={form.fecha_examen_medico} onChange={handleChange('fecha_examen_medico')}
          error={errors.fecha_examen_medico} />
      )}
      {carreraSeleccionada?.campo_link_ironman &&
        modalidades.find(m => String(m.id) === String(form.id_modalidad))?.nombre?.includes('602') && (
          <Input
            label="Link último Ironman corrido"
            id="link_ironman"
            type="url"
            required
            placeholder="Último Ironman corrido después del 01/01/2022"
            value={form.link_ironman}
            onChange={handleChange('link_ironman')}
            error={errors.link_ironman}
          />
        )}
      {carreraSeleccionada?.campo_cert_medico && (
        <div>
          <label className="form-label">Certificado médico</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="form-input py-2 text-sm"
            onChange={(e) => setCertMedico(e.target.files?.[0] || null)}
          />
          {certMedico && (
            <p className="mt-1 text-xs text-success">✓ {certMedico.name}</p>
          )}
        </div>
      )}

      <div>
        <label className="form-label" htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          className="form-input min-h-[80px] resize-y"
          placeholder="Alguna aclaración que nos quieras hacer?"
          value={form.observaciones}
          onChange={handleChange('observaciones')}
        />
      </div>

      <ComprobanteUpload
        file={comprobante}
        required
        onChange={setComprobante}
        error={errors.comprobante}
      />

      <p className="text-xs text-slate">
        Al enviar, tu inscripción quedará en estado{' '}
        <span className="font-semibold text-warning">Pendiente</span> hasta que
        un administrador revise tu comprobante de pago.
      </p>

      {/* Modal de términos y condiciones */}
      {showTerminos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setShowTerminos(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
              <h3 className="font-display text-navy text-lg">Términos y condiciones</h3>
              <button onClick={() => setShowTerminos(false)}
                className="text-slate hover:text-navy text-xl font-bold">✕</button>
            </div>
            <div
              className="overflow-y-auto px-6 py-4 text-sm text-slate leading-relaxed flex-1"
              onScroll={(e) => {
                const el = e.target;
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + 10) {
                  setTerminosLeidos(true);
                }
              }}
            >
              <p className="whitespace-pre-wrap">{TERMINOS_Y_CONDICIONES}</p>
            </div>
            <div className="px-6 py-4 border-t border-black/5">
              {!terminosLeidos && (
                <p className="text-xs text-warning mb-3 text-center">↓ Scrolleá hasta el final para poder aceptar</p>
              )}
              <button
                type="button"
                disabled={!terminosLeidos}
                onClick={() => {
                  setForm((prev) => ({ ...prev, aceptar_condiciones: true }));
                  setErrors((prev) => ({ ...prev, aceptar_condiciones: undefined }));
                  setShowTerminos(false);
                }}
                className="w-full rounded-lg bg-coral px-6 py-3 font-semibold text-white transition hover:bg-danger disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Acepto los términos y condiciones
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-sand/50 px-4 py-3">
          {form.aceptar_condiciones ? (
            <svg className="h-5 w-5 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-slate shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
          <span className="text-sm text-slate uppercase flex-1">
            Declaro aceptar y estar de acuerdo con las condiciones establecidas por los organizadores
          </span>
          {!form.aceptar_condiciones && (
            <button
              type="button"
              onClick={() => { setShowTerminos(true); setTerminosLeidos(false); }}
              className="shrink-0 text-xs font-semibold text-coral hover:underline"
            >
              Ver y aceptar
            </button>
          )}
          {form.aceptar_condiciones && (
            <button
              type="button"
              onClick={() => { setShowTerminos(true); setTerminosLeidos(false); }}
              className="shrink-0 text-xs text-slate hover:underline"
            >
              Ver
            </button>
          )}
        </div>
        {errors.aceptar_condiciones && (
          <p className="form-error mt-1">{errors.aceptar_condiciones}</p>
        )}
      </div>
      <Button type="submit" loading={submitting} className="w-full text-base">
        Confirmar inscripción
      </Button>
    </form>
  );


  return (
    <>
      {/* Toast emergente */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Layout: si hay carrera seleccionada → 3 columnas en desktop */}
      {tieneInfoCarrera ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr] lg:items-start">
          {/* Columna izquierda: Mapa */}
          <div className="order-2 lg:order-1 lg:sticky lg:top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              Ubicación
            </p>
            <MapaCarrera carrera={carreraSeleccionada} />
          </div>

          {/* Columna central: Formulario */}
          <div className="order-1 lg:order-2">
            {formulario}
          </div>

          {/* Columna derecha: Recorrido */}
          <div className="order-3 lg:sticky lg:top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              Recorrido
            </p>
            <RecorridoCarrera carrera={carreraSeleccionada} />
          </div>
        </div>
      ) : (
        /* Sin carrera seleccionada → solo el formulario centrado */
        <div>{formulario}</div>
      )}
    </>
  );
}
