const PATROCINADORES = [
  { nombre: 'Banco del Sur', texto: 'BANCO DEL SUR' },
  { nombre: 'Aguas Andinas', texto: 'AGUAS ANDINAS' },
  { nombre: 'Deportes Norte', texto: 'DEPORTES NORTE' },
  { nombre: 'Energía Activa', texto: 'ENERGÍA ACTIVA' },
  { nombre: 'Salud Total', texto: 'SALUD TOTAL' },
  { nombre: 'Vial Construcciones', texto: 'VIAL CONSTRUCCIONES' },
  { nombre: 'Nutrisport', texto: 'NUTRISPORT' },
  { nombre: 'Radio Circuito', texto: 'RADIO CIRCUITO' }
];

/**
 * Carrusel automatico (marquee) de logos de patrocinadores.
 * Implementado con animacion CSS infinita (sin librerias externas):
 * la lista se duplica y se desplaza, generando un loop continuo.
 */
export default function SponsorsCarousel() {
  const items = [...PATROCINADORES, ...PATROCINADORES];

  return (
    <section className="border-y border-black/5 bg-white py-8">
      <div className="container-page mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate">
          Patrocinadores
        </h2>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="flex w-max animate-marquee gap-12 motion-reduce:animate-none">
          {items.map((sponsor, idx) => (
            <div
              key={`${sponsor.nombre}-${idx}`}
              className="flex h-16 min-w-[180px] items-center justify-center rounded-md border border-black/5 bg-sand px-6 font-display text-sm text-slate"
              aria-hidden={idx >= PATROCINADORES.length}
            >
              {sponsor.texto}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
