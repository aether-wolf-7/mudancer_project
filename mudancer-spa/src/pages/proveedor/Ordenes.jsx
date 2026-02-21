import { useState, useEffect } from "react";
import { getOrdenes, downloadQuotePdf } from "../../api/proveedorApi";

const ADMIN_WA = (import.meta.env.VITE_WHATSAPP_ADMIN ?? "").replace(/\D/g, "");

function buildConcluirWaUrl(quote) {
  if (!ADMIN_WA) return null;
  const leadId = quote.lead?.lead_id ?? quote.lead_id ?? "";
  const cliente = quote.lead?.nombre_cliente ?? "";
  const msg = encodeURIComponent(
    `Hola, he concluido el servicio de mudanza.\nID de solicitud: ${leadId}${cliente ? `\nCliente: ${cliente}` : ""}\nPor favor, ¿puedes marcar el servicio como concluido?`
  );
  return `https://wa.me/${ADMIN_WA}?text=${msg}`;
}

function ProviderPdfBtn({ quoteId, type, label, leadId }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  async function handleClick() {
    setLoading(true);
    setErr(null);
    try {
      const filename = `${type.toUpperCase()}-${leadId || quoteId}.pdf`;
      await downloadQuotePdf(quoteId, type, filename);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        {loading ? "⏳…" : `⬇ ${label}`}
      </button>
      {err && <span className="text-red-500 text-xs ml-1">{err}</span>}
    </span>
  );
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrdenes()
      .then((list) => {
        if (!cancelled) setOrdenes(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[40vh]">
        <p className="text-gray-500">Cargando órdenes…</p>
      </div>
    );
  }

  if (error && ordenes.length === 0) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">ORDENES</h1>
      <p className="text-primary font-semibold mb-6">¡Felicidades, tu oferta fue aceptada!</p>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>
      )}

      {ordenes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No tienes órdenes adjudicadas aún.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">Lead</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Precio</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((quote) => (
                  <tr key={quote.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-primary">
                      {quote.lead?.lead_id ?? quote.lead_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {quote.lead?.nombre_cliente ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      ${Number(quote.precio_total).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Adjudicada
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ProviderPdfBtn quoteId={quote.id} type="cotizacion" label="Cotización PDF" leadId={quote.lead?.lead_id} />
                        <ProviderPdfBtn quoteId={quote.id} type="ods-proveedor" label="ODS PDF" leadId={quote.lead?.lead_id} />
                        {buildConcluirWaUrl(quote) ? (
                          <a
                            href={buildConcluirWaUrl(quote)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                            style={{ background: "#25D366", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <span>✓</span> Concluir (WhatsApp)
                          </a>
                        ) : (
                          <span className="px-3 py-1.5 text-xs text-gray-400">
                            Notify admin to conclude
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
