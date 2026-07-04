/**
 * api.js — Servicio centralizado para comunicación con JSON Server
 * Utiliza Fetch API para operaciones CRUD de incidencias
 */

// URL base del JSON Server
const API_URL = "http://localhost:3001/incidencias";

/**
 * Obtener todas las incidencias
 * @returns {Promise<Array>} Lista de incidencias
 */
export const getIncidents = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al obtener incidencias");
  return response.json();
};

/**
 * Obtener una incidencia por su ID
 * @param {number} id - ID de la incidencia
 * @returns {Promise<Object>} Datos de la incidencia
 */
export const getIncidentById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error("Incidencia no encontrada");
  return response.json();
};

/**
 * Crear una nueva incidencia
 * @param {Object} data - Datos de la nueva incidencia
 * @returns {Promise<Object>} Incidencia creada con ID asignado
 */
export const createIncident = async (data) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear incidencia");
  return response.json();
};

/**
 * Actualizar una incidencia existente
 * @param {number} id - ID de la incidencia a actualizar
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Incidencia actualizada
 */
export const updateIncident = async (id, data) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar incidencia");
  return response.json();
};

/**
 * Eliminar una incidencia
 * @param {number} id - ID de la incidencia a eliminar
 * @returns {Promise<void>}
 */
export const deleteIncident = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar incidencia");
  return response.json();
};

// --- EQUIPOS ---
const EQUIPOS_URL = "http://localhost:3001/equipos";

export const getEquipos = async () => {
  const response = await fetch(EQUIPOS_URL);
  if (!response.ok) throw new Error("Error al obtener equipos");
  return response.json();
};

export const getEquipoById = async (id) => {
  const response = await fetch(`${EQUIPOS_URL}/${id}`);
  if (!response.ok) throw new Error("Equipo no encontrado");
  return response.json();
};

export const createEquipo = async (data) => {
  const response = await fetch(EQUIPOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear equipo");
  return response.json();
};

export const updateEquipo = async (id, data) => {
  const response = await fetch(`${EQUIPOS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar equipo");
  return response.json();
};

export const deleteEquipo = async (id) => {
  const response = await fetch(`${EQUIPOS_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar equipo");
  return response.json();
};
