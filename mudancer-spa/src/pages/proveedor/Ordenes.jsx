import { useState, useEffect } from "react";
import { getOrdenes, downloadQuotePdf, getInventario, saveInventario } from "../../api/proveedorApi";

const ADMIN_WA = (import.meta.env.VITE_WHATSAPP_ADMIN ?? "").replace(/\D/g, "");

// ── Condition codes ────────────────────────────────────────────────────────────
const CONDITIONS = [
  { code: "",    label: "— Buen estado" },
  { code: "RT",  label: "RT – Roto" },
  { code: "CO",  label: "CO – Cortado" },
  { code: "FL",  label: "FL – Flojo/Suelto" },
  { code: "OX",  label: "OX – Oxidado" },
  { code: "QU",  label: "QU – Quemado" },
  { code: "AR",  label: "AR – Arañado" },
  { code: "DP",  label: "DP – Despegado" },
  { code: "BUM", label: "BUM – Golpeado" },
  { code: "RAY", label: "RAY – Rayado" },
  { code: "FAL", label: "FAL – Faltante" },
  { code: "SU",  label: "SU – Sucio" },
  { code: "AB",  label: "AB – Abollado" },
  { code: "RAJ", label: "RAJ – Rajado" },
  { code: "CD",  label: "CD – Desarmado" },
  { code: "DEC", label: "DEC – Decolorado" },
  { code: "FR",  label: "FR – Fracturado" },
  { code: "NF",  label: "NF – No Funciona" },
  { code: "IN",  label: "IN – Incompleto" },
  { code: "DOB", label: "DOB – Doblado" },
  { code: "REP", label: "REP – Reparado" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtMoney(val) {
  if (val == null) return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function buildConcluirWaUrl(quote) {
  if (!ADMIN_WA) return null;
  const leadId  = quote.lead?.lead_id ?? "";
  const cliente = quote.lead?.nombre_cliente ?? "";
  const msg = encodeURIComponent(
    `Hola, he concluido el servicio de mudanza.\nID de solicitud: ${leadId}${cliente ? `\nCliente: ${cliente}` : ""}\nPor favor, ¿puedes marcar el servicio como concluido?`
  );
  return `https://wa.me/${ADMIN_WA}?text=${msg}`;
}

// ── PDF Button ─────────────────────────────────────────────────────────────────
function PdfBtn({ quoteId, type, label, leadId }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  async function handle() {
    setBusy(true); setErr(null);
    try { await downloadQuotePdf(quoteId, type, `${type.toUpperCase()}-${leadId || quoteId}.pdf`); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <span>
      <button type="button" onClick={handle} disabled={busy}
        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
        {busy ? "⏳…" : `⬇ ${label}`}
      </button>
      {err && <span className="text-red-500 text-xs ml-1">{err}</span>}
    </span>
  );
}

// ── Pickup Inventory Form ──────────────────────────────────────────────────────
function InventoryForm({ quote }) {
  const [loadingInv, setLoadingInv]   = useState(true);
  const [declared, setDeclared]       = useState("");
  const [items, setItems]             = useState([]);
  const [saving, setSaving]           = useState(false);
  const [saveOk, setSaveOk]           = useState(false);
  const [saveErr, setSaveErr]         = useState(null);

  useEffect(() => {
    setLoadingInv(true);
    getInventario(quote.id)
      .then((d) => {
        setDeclared(d.inventario_declarado ?? "");
        // Seed from declared inventory if no pickup inventory saved yet
        if (d.inventario_recoleccion && d.inventario_recoleccion.length > 0) {
          setItems(d.inventario_recoleccion);
        } else if (d.inventario_declarado) {
          const lines = d.inventario_declarado
            .split(/\|\||\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          setItems(lines.map((l, i) => ({ numero: i + 1, articulo: l, condicion: "", notas: "" })));
        } else {
          setItems([{ numero: 1, articulo: "", condicion: "", notas: "" }]);
        }
      })
      .catch(() => setItems([{ numero: 1, articulo: "", condicion: "", notas: "" }]))
      .finally(() => setLoadingInv(false));
  }, [quote.id]);

  function updateItem(idx, key, val) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  }

  function addRow() {
    setItems((prev) => [...prev, { numero: prev.length + 1, articulo: "", condicion: "", notas: "" }]);
  }

  function removeRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, numero: i + 1 })));
  }

  async function handleSave() {
    setSaving(true); setSaveOk(false); setSaveErr(null);
    try {
      const filtered = items.filter((it) => it.articulo.trim() !== "");
      await saveInventario(quote.id, filtered);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (e) {
      setSaveErr(e.response?.data?.message || e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loadingInv) return <p className="text-sm text-gray-400 py-4">Cargando inventario…</p>;

  return (
    <div className="mt-4">
      {/* Declared inventory reference */}
      {declared && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1">Inventario declarado por el cliente:</p>
          <p className="text-xs text-blue-600 leading-relaxed">{declared}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-2">
        Registra cada artículo recolectado y su condición. Esta información se refleja en el ODS PDF.
      </p>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Artículo</div>
        <div className="col-span-3">Condición</div>
        <div className="col-span-3">Notas</div>
        <div className="col-span-1"></div>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-1 items-center">
            <div className="col-span-1 text-xs text-gray-400 text-center">{item.numero}</div>
            <div className="col-span-4">
              <input
                type="text"
                value={item.articulo}
                onChange={(e) => updateItem(idx, "articulo", e.target.value)}
                placeholder="Nombre del artículo"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-3">
              <select
                value={item.condicion}
                onChange={(e) => updateItem(idx, "condicion", e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-primary bg-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                value={item.notas}
                onChange={(e) => updateItem(idx, "notas", e.target.value)}
                placeholder="Notas (opcional)"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-1 text-center">
              <button type="button" onClick={() => removeRow(idx)}
                className="text-red-400 hover:text-red-600 text-base font-bold leading-none">×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add row */}
      <button type="button" onClick={addRow}
        className="mt-2 text-xs text-primary font-semibold hover:underline">
        + Agregar artículo
      </button>

      {/* Save */}
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar inventario"}
        </button>
        {saveOk  && <span className="text-xs text-green-600 font-semibold">✓ Guardado</span>}
        {saveErr && <span className="text-xs text-red-600">{saveErr}</span>}
      </div>
    </div>
  );
}

// ── Order Card (expandable) ────────────────────────────────────────────────────
function OrderCard({ quote }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState("info"); // "info" | "inventario"
  const lead = quote.lead;
  const waUrl = buildConcluirWaUrl(quote);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-primary">{lead?.lead_id ?? "—"}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{lead?.nombre_cliente ?? "—"}</span>
          </div>
          <div className="text-xs text-gray-500">
            {[lead?.localidad_origen, lead?.estado_origen].filter(Boolean).join(", ") || "—"}
            <span className="mx-1">→</span>
            {[lead?.localidad_destino, lead?.estado_destino].filter(Boolean).join(", ") || "—"}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-extrabold text-green-600">{fmtMoney(quote.precio_total)}</div>
          <div className="text-xs text-gray-400">Apartado: {fmtMoney(quote.apartado)}</div>
        </div>
        <span className="text-gray-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {["info", "inventario"].map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-semibold capitalize transition-colors
                  ${tab === t ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t === "info" ? "Información" : "Inventario de Recolección"}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <div className="flex flex-col gap-3">
              {/* Price breakdown */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Desglose de Cobros</p>
                {[
                  ["Apartado (reserva)", quote.apartado],
                  ["Anticipo (día recolección)", quote.anticipo],
                  ["Pago final (destino)", quote.pago_final],
                  ...(quote.tarifa_seguro ? [["Póliza seguro", quote.tarifa_seguro]] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{lbl}</span>
                    <span className="font-semibold">{fmtMoney(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-green-600">{fmtMoney(quote.precio_total)}</span>
                </div>
              </div>

              {/* Notes */}
              {quote.notas && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-500 mb-1">Notas de la cotización</p>
                  <p className="text-sm text-gray-700 italic">{quote.notas}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-1">
                <PdfBtn quoteId={quote.id} type="cotizacion"    label="Cotización PDF" leadId={lead?.lead_id} />
                <PdfBtn quoteId={quote.id} type="ods-proveedor" label="ODS PDF"        leadId={lead?.lead_id} />
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-white rounded-lg inline-flex items-center gap-1"
                    style={{ background: "#25D366" }}>
                    ✓ Concluir (WhatsApp)
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 self-center">Avisa al administrador para concluir</span>
                )}
              </div>
            </div>
          )}

          {tab === "inventario" && <InventoryForm quote={quote} />}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrdenes()
      .then((list) => { if (!cancelled) setOrdenes(list); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="p-4 flex justify-center items-center min-h-[40vh]">
      <p className="text-gray-500">Cargando órdenes…</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Órdenes de Servicio</h1>
      <p className="text-primary font-semibold mb-5 text-sm">¡Felicidades, tu oferta fue aceptada!</p>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

      {ordenes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No tienes órdenes adjudicadas aún.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ordenes.map((quote) => (
            <OrderCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
