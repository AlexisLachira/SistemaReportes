/**
 * api.js — Servicio centralizado para comunicación con JSON Server
 * Utiliza Fetch API para operaciones CRUD de incidencias
 */

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/incidencias`;

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
const EQUIPOS_URL = `${BASE_URL}/equipos`;

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

// --- MANTENIMIENTOS ---
const MANTENIMIENTOS_URL = `${BASE_URL}/mantenimientos`;

export const getMantenimientos = async () => {
  const response = await fetch(MANTENIMIENTOS_URL);
  if (!response.ok) throw new Error("Error al obtener mantenimientos");
  return response.json();
};

export const createMantenimiento = async (data) => {
  const response = await fetch(MANTENIMIENTOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear mantenimiento");
  return response.json();
};

export const updateMantenimiento = async (id, data) => {
  const response = await fetch(`${MANTENIMIENTOS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar mantenimiento");
  return response.json();
};

// --- HISTORIAL ---
const HISTORIAL_URL = `${BASE_URL}/historialIncidencias`;

export const getHistorial = async () => {
  const response = await fetch(HISTORIAL_URL);
  if (!response.ok) throw new Error("Error al obtener historial");
  return response.json();
};

export const getHistorialByIncidencia = async (incidenciaId) => {
  const response = await fetch(HISTORIAL_URL);
  if (!response.ok) throw new Error("Error al obtener historial");
  const data = await response.json();
  return data.filter(h => String(h.incidenciaId) === String(incidenciaId));
};

export const createHistorial = async (data) => {
  const response = await fetch(HISTORIAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, fecha: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("Error al registrar en historial");
  return response.json();
};

// --- USUARIOS ---
const USUARIOS_URL = `${BASE_URL}/usuarios`;

export const getUsuarios = async () => {
  const response = await fetch(USUARIOS_URL);
  if (!response.ok) throw new Error("Error al obtener usuarios");
  return response.json();
};

// --- TÉCNICOS ---
const TECNICOS_URL = `${BASE_URL}/tecnicos`;

export const getTecnicos = async () => {
  const response = await fetch(TECNICOS_URL);
  if (!response.ok) throw new Error("Error al obtener técnicos");
  return response.json();
};

export const getTecnicoById = async (id) => {
  const response = await fetch(`${TECNICOS_URL}/${id}`);
  if (!response.ok) throw new Error("Error al obtener técnico");
  return response.json();
};

export const createTecnico = async (data) => {
  const response = await fetch(TECNICOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear técnico");
  return response.json();
};

export const updateTecnico = async (id, data) => {
  const response = await fetch(`${TECNICOS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar técnico");
  return response.json();
};

export const deleteTecnico = async (id) => {
  const response = await fetch(`${TECNICOS_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar técnico");
  return response.json();
};
