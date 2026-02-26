import { useState, useEffect, useCallback } from "react";
import { getOrdenes, concluirLead, getPdfTempUrl, marcarPago, generateShareToken } from "../../api/adminApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function fmtMoney(val) {
  if (val === null || val === undefined || val === "") return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function Stars({ value, max = 5 }) {
  const n = Math.round(Number(value) || 0);
  return (
    <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: -1 }}>
      {"★".repeat(n)}{"☆".repeat(Math.max(0, max - n))}
      <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 5 }}>{n}/{max}</span>
    </span>
  );
}

function ProviderAvatar({ logo, nombre, size = 44 }) {
  const initial = (nombre || "?")[0].toUpperCase();
  if (logo) {
    return (
      <img
        src={logo}
        alt={nombre}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "#e5e7eb", display: "flex", alignItems: "center",
        justifyContent: "center", fontWeight: 700, fontSize: size * 0.38,
        color: "#6b7280", flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ── PDF Download Button ───────────────────────────────────────────────────────

function PdfButton({ label, quoteId, type, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleClick() {
    setError(null);

    // Open the window IMMEDIATELY while the tap/click is still a user gesture.
    // Mobile browsers (iOS Safari, Android Chrome) block window.open() called
    // after an await, so we must open first and redirect once the URL is ready.
    const win = window.open("", "_blank");
    if (!win) {
      setError("Tu navegador bloqueó la ventana. Permite ventanas emergentes para este sitio e intenta de nuevo.");
      return;
    }

    setLoading(true);
    try {
      const url = await getPdfTempUrl(quoteId, type);
      win.location.href = url;
    } catch (err) {
      win.close();
      setError(err.response?.data?.message || err.message || "Error al generar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: "100%", padding: compact ? "10px 0" : "14px 0",
          background: loading ? "#f0fdf4" : "#fff",
          border: "2px solid #22c55e",
          borderRadius: 12, color: "#374151",
          fontSize: compact ? 13 : 14, fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          textAlign: "center", transition: "background 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#f0fdf4"; }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = loading ? "#f0fdf4" : "#fff"; }}
      >
        {loading ? "⏳ Generando…" : label}
      </button>
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

// ── Shareable Link Button ─────────────────────────────────────────────────────

function ShareLinkButton({ quoteId, docType }) {
  const [busy, setBusy]     = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr]       = useState(null);

  async function handleClick() {
    setBusy(true);
    setErr(null);
    try {
      const result = await generateShareToken(quoteId);
      const url = result?.urls?.[docType];
      if (!url) throw new Error("No URL returned");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setErr("Copy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        title="Copy shareable public link"
        style={{
          width: "100%", padding: "10px 0",
          background: copied ? "#f0fdf4" : "#fff",
          border: "2px solid #64748b",
          borderRadius: 12, color: copied ? "#16a34a" : "#475569",
          fontSize: 13, fontWeight: 500,
          cursor: busy ? "not-allowed" : "pointer",
          textAlign: "center", transition: "background 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        {busy ? "⏳ Generating…" : copied ? "✓ Link copied!" : "📋 Copy shareable link"}
      </button>
      {err && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#dc2626" }}>{err}</p>}
    </div>
  );
}

// ── Doc Row (Download + Share pair) ──────────────────────────────────────────

function DocRow({ label, quoteId, type }) {
  return (
    <div style={{ borderRadius: 12, border: "1.5px solid #e5e7eb", overflow: "hidden" }}>
      <p style={{ margin: 0, padding: "7px 12px 0", fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: 8, padding: "6px 10px 10px" }}>
        <div style={{ flex: 1 }}>
          <PdfButton label="⬇ Ver PDF" quoteId={quoteId} type={type} compact />
        </div>
        <div style={{ flex: 1 }}>
          <ShareLinkButton quoteId={quoteId} docType={type} />
        </div>
      </div>
    </div>
  );
}

// ── Lead Summary Card ─────────────────────────────────────────────────────────

function LeadCard({ order, selected, onClick }) {
  const isNew = order.is_new;
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: selected
          ? "2px solid #22c55e"
          : isNew
          ? "2px solid #f59e0b"
          : "1.5px solid #e5e7eb",
        padding: "0.875rem 1.125rem",
        cursor: "pointer",
        boxShadow: selected
          ? "0 2px 12px rgba(34,197,94,0.2)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.18s",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "baseline", marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>{fmtDate(order.created_at)}</span>
        <span style={{ color: "#94a3b8" }}>|</span>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e5a9e" }}>ID {order.public_id || order.id}</span>
        <span style={{ color: "#94a3b8" }}>|</span>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.client_name || "—"}</span>
      </div>
      <p style={{ margin: "0 0 2px", fontSize: "0.8375rem", fontWeight: 500, color: "#16a34a" }}>
        {[order.origin_state, order.origin_city].filter(Boolean).join(", ") || "—"}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: "0.8375rem", fontWeight: 500, color: "#dc2626" }}>
        {[order.destination_state, order.destination_city].filter(Boolean).join(", ") || "—"}
      </p>
      {(order.client_phone || order.telefono_cliente) && (
        <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>
          📞 {order.client_phone || order.telefono_cliente}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{fmtDate(order.ideal_date)}</span>
        {order.assigned_quote && (
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, borderRadius: 20, padding: "2px 8px",
            background: order.assigned_quote.apartado_pagado ? "#dcfce7" : "#fef3c7",
            color:  order.assigned_quote.apartado_pagado ? "#166534" : "#92400e",
          }}>
            {order.assigned_quote.apartado_pagado ? "✓ Apartado recibido" : "⏳ Apartado pendiente"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Order Detail View ─────────────────────────────────────────────────────────

function OrderDetail({ order, onBack, onConcluded, onOrderUpdated }) {
  const q = order.assigned_quote;
  const p = q?.provider;

  const [confirming, setConfirming]     = useState(false);
  const [concluding, setConcluding]     = useState(false);
  const [concludeError, setConcludeError] = useState(null);
  const [pagoBusy, setPagoBusy]         = useState(false);
  const [pagoError, setPagoError]       = useState(null);
  const [apartadoPagado, setApartadoPagado] = useState(!!q?.apartado_pagado);

  async function handleTogglePago() {
    setPagoBusy(true);
    setPagoError(null);
    try {
      const updated = await marcarPago(q.id);
      setApartadoPagado(!!updated?.apartado_pagado);
      if (onOrderUpdated) onOrderUpdated({ ...order, assigned_quote: { ...q, apartado_pagado: updated?.apartado_pagado } });
    } catch (err) {
      setPagoError(err.response?.data?.message || err.message || "Error");
    } finally {
      setPagoBusy(false);
    }
  }

  async function handleConclude() {
    setConcluding(true);
    setConcludeError(null);
    try {
      await concluirLead(order.id);
      onConcluded(order.id);
    } catch (err) {
      setConcludeError(err.response?.data?.message || err.message || "Failed to conclude order.");
      setConfirming(false);
    } finally {
      setConcluding(false);
    }
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          color: "#64748b", fontSize: 14, fontWeight: 500,
          marginBottom: 14, padding: 0,
        }}
      >
        ← Volver a Órdenes
      </button>

      {/* Lead summary card */}
      <LeadCard order={order} selected={false} isNew={false} onClick={() => {}} />

      {/* Assigned supplier card */}
      {q && p && (
        <div
          style={{
            marginTop: 14,
            background: "#fff",
            border: "2px solid #22c55e",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 2px 14px rgba(34,197,94,0.15)",
          }}
        >
          <ProviderAvatar logo={p.logo} nombre={p.nombre} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.nombre}
            </p>
            <Stars value={p.reputacion} />
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 20, color: "#16a34a", margin: "0 0 2px" }}>
              {fmtMoney(q.precio_total)}
            </p>
            {q.precio_proveedor != null && (
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                Proveedor: {fmtMoney((Number(q.precio_proveedor) || 0) + (Number(q.tarifa_seguro) || 0))}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Apartado payment status ── */}
      {q && (
        <div style={{ marginTop: 14, background: apartadoPagado ? "#f0fdf4" : "#fffbeb", border: `1.5px solid ${apartadoPagado ? "#86efac" : "#fcd34d"}`, borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Apartado</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: apartadoPagado ? "#16a34a" : "#d97706" }}>
                {apartadoPagado ? "✓ Pagado" : "⏳ Pendiente"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>${Number(q.apartado).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p>
            </div>
            <button
              type="button"
              onClick={handleTogglePago}
              disabled={pagoBusy}
              style={{
                padding: "8px 18px", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                border: "none", borderRadius: 10, cursor: pagoBusy ? "not-allowed" : "pointer",
                background: apartadoPagado ? "#fee2e2" : "#22c55e",
                color: apartadoPagado ? "#dc2626" : "#fff",
                transition: "background 0.2s",
              }}
            >
              {pagoBusy ? "…" : apartadoPagado ? "Marcar como pendiente" : "Marcar apartado como recibido"}
            </button>
          </div>
          {pagoError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626" }}>{pagoError}</p>}
        </div>
      )}

      {/* Documents section — each row has Download + Copy Shareable Link */}
      {q && (
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 10px" }}>
            Documentos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <DocRow label="Cotización" quoteId={q.id} type="cotizacion" />
            <DocRow label="ODS Cliente" quoteId={q.id} type="ods-cliente" />
            <DocRow label="ODS Proveedor" quoteId={q.id} type="ods-proveedor" />
          </div>
        </div>
      )}

      {/* Quote notes */}
      {q?.notas && (
        <div style={{ marginTop: 20, background: "#f9fafb", borderRadius: 12, padding: "12px 16px" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, margin: "0 0 4px" }}>Notas</p>
          <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.5 }}>{q.notas}</p>
        </div>
      )}

      {/* ── Conclude Service ── */}
      <div style={{ marginTop: 28, borderTop: "1.5px solid #f1f5f9", paddingTop: 20 }}>
        {concludeError && (
          <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: 13, marginBottom: 12 }}>
            {concludeError}
          </div>
        )}

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{
              width: "100%", padding: "0.875rem", fontSize: 15, fontWeight: 700,
              fontFamily: "inherit", color: "#fff", background: "#0f172a",
              border: "none", borderRadius: 12, cursor: "pointer",
              boxShadow: "0 3px 10px rgba(0,0,0,0.18)", transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1e293b"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0f172a"; }}
          >
            Concluir Servicio
          </button>
        ) : (
          <div style={{ background: "#fefce8", border: "1.5px solid #fbbf24", borderRadius: 12, padding: "1rem" }}>
            <p style={{ margin: "0 0 0.875rem", fontSize: 14, color: "#78350f", fontWeight: 600, textAlign: "center" }}>
              ¿Confirmar que este servicio ha concluido?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={concluding}
                style={{ flex: 1, padding: "0.75rem", fontSize: 14, fontWeight: 600, fontFamily: "inherit", color: "#374151", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConclude}
                disabled={concluding}
                style={{ flex: 1, padding: "0.75rem", fontSize: 14, fontWeight: 700, fontFamily: "inherit", color: "#fff", background: concluding ? "#86efac" : "#16a34a", border: "none", borderRadius: 10, cursor: concluding ? "not-allowed" : "pointer", transition: "background 0.2s" }}
              >
                {concluding ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    getOrdenes()
      .then(setOrders)
      .catch((err) => setError(err.response?.data?.message || err.message || "Error loading orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleConcluded(orderId) {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null);
  }

  function handleOrderUpdated(updatedOrder) {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  }

  // ── Detail view ─────────────────────────────────────────────────────────
  if (selectedOrder) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.25rem 1rem 2.5rem" }}>
        <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", margin: "0 0 1.25rem" }}>
          ORDER
        </h1>
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} onConcluded={handleConcluded} onOrderUpdated={handleOrderUpdated} />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.25rem 1rem 2.5rem" }}>

      <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", margin: "0 0 1rem" }}>
        ÓRDENES
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>Cargando…
        </div>
      ) : error ? (
        <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "1rem", textAlign: "center" }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📦</div>
          No hay órdenes asignadas aún.
        </div>
      ) : (
        <>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} — click to view details
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {orders.map((order) => (
              <LeadCard
                key={order.id}
                order={order}
                selected={false}
                isNew={!!order.is_new}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
