/**
 * Calcula la edad en años a partir de una fecha de nacimiento.
 * Replica la logica del backend para mostrar un preview inmediato
 * en el formulario, aunque el calculo final/autoritativo lo hace el servidor.
 *
 * @param {string} fechaNacimiento - Fecha en formato YYYY-MM-DD
 * @returns {number|null}
 */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  if (Number.isNaN(nacimiento.getTime())) return null;

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const aunNoCumplio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (aunNoCumplio) edad -= 1;

  return edad;
}

/**
 * Determina, entre una lista de modalidades, cual corresponde
 * segun edad y sexo (preview en frontend).
 *
 * @param {Array<Object>} modalidades
 * @param {number} edad
 * @param {string} sexo
 * @returns {Object|null}
 */
export function calcularModalidadSugerida(modalidades, edad, sexo) {
  if (!Array.isArray(modalidades) || modalidades.length === 0 || edad === null) {
    return null;
  }

  const candidatas = modalidades.filter((m) => {
    const sexoCompatible = m.sexo === 'otro' || m.sexo === sexo;
    const edadCompatible = edad >= m.edad_minima && edad <= m.edad_maxima;
    return sexoCompatible && edadCompatible;
  });

  if (candidatas.length === 0) return null;

  const exacta = candidatas.find((m) => m.sexo === sexo);
  return exacta || candidatas[0];
}
