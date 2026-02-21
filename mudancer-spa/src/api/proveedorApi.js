import { proveedorApi, getProviderToken } from "./proveedorClient";
import { downloadAuthPdf, apiBase } from "./pdfUtils.js";

export async function login(email, password) {
  const { data } = await proveedorApi.post("/proveedor/login", { email, password });
  return data;
}

export async function getLeads() {
  const { data } = await proveedorApi.get("/proveedor/leads");
  const list = data?.data;
  return Array.isArray(list) ? list : [];
}

export async function getLead(id) {
  const { data } = await proveedorApi.get(`/proveedor/leads/${id}`);
  return data?.data ?? null;
}

export async function submitQuote(leadId, body) {
  const { data } = await proveedorApi.post(`/proveedor/leads/${leadId}/cotizar`, body);
  return data?.data ?? null;
}

export async function getOrdenes() {
  const { data } = await proveedorApi.get("/proveedor/ordenes");
  const list = data?.data;
  return Array.isArray(list) ? list : [];
}

export async function concludeOrder(quoteId) {
  const { data } = await proveedorApi.post(`/proveedor/ordenes/${quoteId}/concluir`);
  return data;
}

/**
 * Download a PDF document for an assigned quote (provider).
 * type: 'cotizacion' | 'ods-proveedor'
 */
export async function downloadQuotePdf(quoteId, type, filename) {
  const url = `${apiBase()}/proveedor/quotes/${quoteId}/pdf/${type}`;
  await downloadAuthPdf(url, getProviderToken(), filename);
}
