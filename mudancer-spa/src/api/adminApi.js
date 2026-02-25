/**
 * Admin API using axios client (sends Bearer token from localStorage).
 */

import api, { getAdminToken } from "./client";
import { downloadAuthPdf, apiBase, storageBase } from "./pdfUtils.js";

/** Re-compute imagenes_urls from the raw path array so we never rely on APP_URL. */
function withImagenesUrls(lead) {
  if (!lead) return lead;
  const paths = Array.isArray(lead.imagenes) ? lead.imagenes : [];
  return { ...lead, imagenes_urls: paths.map((p) => `${storageBase()}/${p}`) };
}

export async function login(identifier, password) {
  const { data } = await api.post("/admin/login", { identifier, password });
  return data;
}

export async function getLeads() {
  const { data } = await api.get("/admin/leads");
  const list = data?.data;
  return Array.isArray(list) ? list : [];
}

export async function getLead(id) {
  const { data } = await api.get(`/admin/leads/${id}`);
  return withImagenesUrls(data?.data ?? null);
}

export async function updateLead(id, body) {
  const { data } = await api.put(`/admin/leads/${id}`, body);
  return data?.data ?? null;
}

/** Upload one or more files to the lead's gallery. Returns { imagenes, imagenes_urls }. */
export async function uploadLeadImagen(id, files) {
  const form = new FormData();
  const list = Array.isArray(files) ? files : [files];
  list.forEach((f) => form.append("imagenes[]", f));
  const { data } = await api.post(`/admin/leads/${id}/imagen`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const paths = Array.isArray(data?.imagenes) ? data.imagenes : [];
  return { imagenes: paths, imagenes_urls: paths.map((p) => `${storageBase()}/${p}`) };
}

/** Remove a single file from the lead's gallery by its stored path. Returns { imagenes, imagenes_urls }. */
export async function removeLeadImagen(id, path) {
  const { data } = await api.delete(`/admin/leads/${id}/imagen`, { data: { path } });
  const paths = Array.isArray(data?.imagenes) ? data.imagenes : [];
  return { imagenes: paths, imagenes_urls: paths.map((p) => `${storageBase()}/${p}`) };
}

export async function publishLead(id) {
  const { data } = await api.post(`/admin/leads/${id}/publish`);
  return { lead: data?.data, url: data?.url };
}

export async function adjudicarLead(id) {
  const { data } = await api.post(`/admin/leads/${id}/adjudicar`);
  return data?.data ?? null;
}

export async function concluirLead(id) {
  const { data } = await api.post(`/admin/leads/${id}/concluir`);
  return data?.data ?? null;
}

export async function getProviders({ page = 1, search = "", searchBy = "nombre", perPage = 10 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (search.trim()) {
    params.append("search", search.trim());
    params.append("search_by", searchBy);
  }
  const { data } = await api.get(`/admin/providers?${params}`);
  return data; // Laravel paginated: { data: [], current_page, last_page, total, ... }
}

export async function createProvider(body) {
  const { data } = await api.post("/admin/providers", body);
  return data;
}

export async function updateProvider(id, body) {
  const { data } = await api.put(`/admin/providers/${id}`, body);
  return data;
}

/** GET /api/admin/cotizadas — published, non-adjudicated leads with quotes. */
export async function getCotizadas() {
  const { data } = await api.get("/admin/cotizadas");
  const list = data?.data;
  return Array.isArray(list) ? list : [];
}

/** GET /api/admin/ordenes — adjudicated leads with their selected quote. */
export async function getOrdenes() {
  const { data } = await api.get("/admin/ordenes");
  const list = data?.data;
  return Array.isArray(list) ? list : [];
}

/** POST /api/admin/quotes/{quote}/asignar — assign quote → moves lead to Orders. */
export async function assignQuote(quoteId) {
  const { data } = await api.post(`/admin/quotes/${quoteId}/asignar`);
  return data ?? null;
}

/** POST /api/admin/quotes/{quote}/marcar-pago — toggle apartado_pagado. */
export async function marcarPago(quoteId) {
  const { data } = await api.post(`/admin/quotes/${quoteId}/marcar-pago`);
  return data?.data ?? null;
}

/**
 * Get a temporary (120 sec) one-time PDF URL — works on mobile and desktop.
 * type: 'cotizacion' | 'ods-cliente' | 'ods-proveedor'
 */
export async function getPdfTempUrl(quoteId, type) {
  const { data } = await api.post(`/admin/quotes/${quoteId}/pdf-token/${type}`);
  return data.url;
}

/**
 * @deprecated Use getPdfTempUrl() + window.open() instead for mobile compatibility.
 */
export async function downloadQuotePdf(quoteId, type, filename) {
  const url = `${apiBase()}/admin/quotes/${quoteId}/pdf/${type}`;
  await downloadAuthPdf(url, getAdminToken(), filename);
}

/**
 * Generate (or retrieve) a shareable public token for a quote.
 * Returns { token, urls: { cotizacion, ods-cliente, ods-proveedor } }
 */
export async function generateShareToken(quoteId) {
  const { data } = await api.post(`/admin/quotes/${quoteId}/share-token`);
  return data; // { token, urls }
}
