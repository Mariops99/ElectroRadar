/**
 * @typedef {{
 *  id: string,
 * nombre: string,
 * horario: string,
 * lugar: string,
 * direccion: direccion,
 * coordenadas: coordenadas,
 * operador: string,
 * activacion: string,
 * cargadores: cargador[]
 * }} electrolinera
 */

/**
 * @typedef {{
 * calle: string,
 * codigoPostal: string,
 * localidad: string,
 * provincia: string,
 * comunidadAutonoma: string
 * }} direccion
 *
 */

/**
 * @typedef {{
 * latitud: string,
 * longitud: string
 * }} coordenadas
 */

/**
 * @typedef {{
 * id: string,
 * nombre: string,
 * conectores: conector[]
 * }} cargador
 */

/**
 * @typedef {{
 * tipo: string,
 * formato: string,
 * potencia: string,
 * amperaje: string,
 * voltaje: string
 * }} conector
 */

export {}