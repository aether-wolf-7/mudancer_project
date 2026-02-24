/**
 * Downloads a PDF from an authenticated endpoint.
 * Uses fetch with a blob response so the Bearer token is sent.
 *
 * @param {string} url      - Full API URL (e.g. "/api/admin/quotes/5/pdf/cotizacion")
 * @param {string} token    - Bearer token
 * @param {string} filename - Suggested filename for the download
 */
export async function downloadAuthPdf(url, token, filename) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PDF download failed (${response.status}): ${text}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Builds the base API URL (same logic as axios client.js).
 */
export function apiBase() {
  const env = (import.meta.env.VITE_API_URL ?? "").trim();
  return env ? `${env.replace(/\/$/, "")}/api` : "/api";
}

/**
 * Builds the public storage URL base (strips the "/api" suffix from apiBase).
 * e.g.  https://app.mudancer.com/api  →  https://app.mudancer.com/storage
 */
export function storageBase() {
  return apiBase().replace(/\/api$/, "") + "/storage";
}
