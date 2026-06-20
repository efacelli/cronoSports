import { SEXO_LABEL } from '../../utils/formatters';

/**
 * Muestra la edad calculada y la modalidad/categoria sugerida
 * en base a la fecha de nacimiento y el sexo ingresados.
 * Este calculo es solo informativo: el backend recalcula y
 * asigna la categoria de forma autoritativa al registrar la inscripcion.
 */
export default function CategoriaPreview({ edad, modalidad, sexo, sinModalidades }) {
  if (edad === null) return null;

  return (
    <div className="rounded-md border border-navy/10 bg-navy/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">
        Categoría asignada automáticamente
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-slate">Edad</p>
          <p className="bib-number text-lg">{edad} años</p>
        </div>

        {sexo && (
          <div>
            <p className="text-xs text-slate">Sexo</p>
            <p className="text-sm font-semibold text-navy">{SEXO_LABEL[sexo]}</p>
          </div>
        )}

        <div className="flex-1">
          <p className="text-xs text-slate">Modalidad / Categoría</p>
          {modalidad ? (
            <p className="text-sm font-semibold text-success">{modalidad.nombre}</p>
          ) : (
            <p className="text-sm font-semibold text-warning">
              {sinModalidades
                ? 'Seleccioná una carrera para ver las modalidades disponibles'
                : 'No hay una categoría disponible para esta edad y sexo'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
