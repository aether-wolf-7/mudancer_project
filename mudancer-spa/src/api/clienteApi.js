/**
 * Cliente API — unauthenticated.
 * Handles lead lookup by phone and quote interest marking.
 */
import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL ?? "").trim()
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
  : "/api";

export const clienteApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * POST /api/cliente/login — look up a lead by 10-digit phone.
 *
 * Returns { status: 'not_found' | 'pending' | 'published', message?, lead?, quotes? }
 * - not_found : 404, no lead for this phone
 * - pending   : 200, lead exists but not yet published by admin
 * - published : 200, lead is published; quotes array included
 */
export async function verCotizaciones(telefono) {
  try {
    const { data } = await clienteApi.post("/cliente/login", { telefono });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      return { status: "not_found", message: err.response.data?.message ?? "No encontramos ninguna solicitud con ese número." };
    }
    throw err;
  }
}

/**
 * PUT /api/cliente/quotes/{id}/seleccionar
 * Marks the quote as the client's preferred choice (cliente_interesada = true).
 */
export async function marcarInteres(quoteId) {
  const { data } = await clienteApi.put(`/cliente/quotes/${quoteId}/seleccionar`);
  return data;
}

/** @deprecated renamed to marcarInteres */
export const seleccionarQuote = marcarInteres;
