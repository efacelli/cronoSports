import InscripcionForm from '../components/inscripcion/InscripcionForm';

export default function InscripcionPage() {
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  return (
    <section className="bg-sand py-12">
      <div className="container-page">
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-coral">Formulario</p>
          <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">
            Inscripción a la carrera
          </h1>
          <p className="mt-3 text-slate">
            Completá tus datos, adjuntá el comprobante de pago y te asignaremos
            automáticamente tu categoría según tu edad y sexo.
          </p>
        </div>

        {/* El formulario maneja el layout 3-col internamente */}
        <InscripcionForm />
      </div>
    </section>
  );
}
