import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads } from "../../api/proveedorApi";

function formatDate(str) {
  if (!str) return null;
  const d = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function originDestino(lead) {
  const o = [lead.localidad_origen, lead.estado_origen].filter(Boolean).join(", ") || "—";
  const d = [lead.localidad_destino, lead.estado_destino].filter(Boolean).join(", ") || "—";
  return { o, d };
}

/**
 * Visual config per supplier_state.
 *
 * nueva      → never viewed           → yellow card, can quote
 * disponible → viewed, not quoted     → white card, can quote
 * cotizada   → this supplier quoted   → grey dimmed, locked
 * adjudicada → assigned to another    → grey dimmed, locked
 */
const STATE_META = {
  nueva: {
    label:   "NUEVA",
    badge:   { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" },
    card:    { background: "#fefce8", borderColor: "#fde047" },
    dot:     "#ca8a04",
    locked:  false,
  },
  disponible: {
    label:   "DISPONIBLE",
    badge:   { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
    card:    { background: "#fff", borderColor: "#e5e7eb" },
    dot:     "#16a34a",
    locked:  false,
  },
  cotizada: {
    label:   "COTIZADA",
    badge:   { background: "#f1f5f9", color: "#94a3b8", border: "1px solid #cbd5e1" },
    card:    { background: "#f8fafc", borderColor: "#e2e8f0" },
    dot:     "#94a3b8",
    locked:  true,
  },
  adjudicada: {
    label:   "ADJUDICADA",
    badge:   { background: "#f1f5f9", color: "#94a3b8", border: "1px solid #cbd5e1" },
    card:    { background: "#f8fafc", borderColor: "#e2e8f0" },
    dot:     "#94a3b8",
    locked:  true,
  },
};

// ── Lead Card ─────────────────────────────────────────────────────────────────
function LeadCard({ lead, onClick }) {
  const { o, d } = originDestino(lead);
  const meta  = STATE_META[lead.supplier_state] ?? STATE_META.disponible;
  const date  = formatDate(lead.fecha_recoleccion);

  return (
    <div
      onClick={onClick}
      style={{
        background:   meta.card.background,
        border:       `1.5px solid ${meta.card.borderColor}`,
        borderRadius: 14,
        padding:      "0.875rem 1rem",
        cursor:       "pointer",
        opacity:      meta.locked ? 0.72 : 1,
        transition:   "box-shadow 0.18s, transform 0.15s, opacity 0.15s",
        position:     "relative",
      }}
      onMouseEnter={(e) => {
        if (!meta.locked) {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top row: state badge + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", gap: "0.5rem" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
          padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
          letterSpacing: "0.05em", lineHeight: 1.6,
          ...meta.badge,
        }}>
          {/* Colored dot */}
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
          {meta.label}
          {meta.locked && <span style={{ marginLeft: 2 }}>🔒</span>}
        </span>

        {date && (
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            📅 {date}
          </span>
        )}
      </div>

      {/* Client name */}
      <p style={{
        margin: "0 0 0.5rem",
        fontWeight: 700,
        fontSize: "0.9375rem",
        color: meta.locked ? "#94a3b8" : "#1e293b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {lead.nombre_cliente || "—"}
      </p>

      {/* Origin → Destination */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "0.8125rem", flexWrap: "wrap" }}>
        <span style={{
          background: "#f0fdf4", color: "#15803d",
          border: "1px solid #bbf7d0",
          borderRadius: 6, padding: "2px 8px",
          fontWeight: 500, whiteSpace: "nowrap",
          maxWidth: "calc(50% - 1rem)", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          📍 {o}
        </span>
        <span style={{ color: "#9ca3af", alignSelf: "center", fontSize: "0.75rem" }}>→</span>
        <span style={{
          background: "#fef2f2", color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: 6, padding: "2px 8px",
          fontWeight: 500, whiteSpace: "nowrap",
          maxWidth: "calc(50% - 1rem)", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          🏁 {d}
        </span>
      </div>
    </div>
  );
}

// ── Summary chip ──────────────────────────────────────────────────────────────
function StateChip({ stateKey, count }) {
  const meta = STATE_META[stateKey];
  if (!meta || !count) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "3px 10px", borderRadius: 20,
      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
      ...meta.badge,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />
      {meta.label} {count}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLeads()
      .then((list) => { if (!cancelled) setLeads(list); })
      .catch((err)  => { if (!cancelled) setError(err.message); })
      .finally(()   => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const q        = search.trim().toLowerCase();
  const filtered = q
    ? leads.filter((l) =>
        [l.nombre_cliente, l.estado_origen, l.estado_destino,
         l.localidad_origen, l.localidad_destino]
          .some((v) => v && v.toLowerCase().includes(q))
      )
    : leads;

  const counts = leads.reduce((acc, l) => {
    acc[l.supplier_state] = (acc[l.supplier_state] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div style={{ padding: "2rem 1rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando leads…</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: "1rem" }}>
      <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "1rem", fontSize: "0.875rem" }}>{error}</div>
    </div>
  );

  return (
    <>
      {/* Responsive grid CSS */}
      <style>{`
        .leads-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .leads-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .leads-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .leads-search:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem 1rem 2.5rem" }}>

        {/* Header */}
        <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1e293b", margin: "0 0 1rem", letterSpacing: "-0.01em" }}>
          Leads
        </h1>

        {/* State summary chips */}
        {leads.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
            {["nueva", "disponible", "cotizada", "adjudicada"].map((k) => (
              <StateChip key={k} stateKey={k} count={counts[k]} />
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: "1.25rem" }}>
          <input
            className="leads-search"
            type="search"
            placeholder="Buscar por cliente, origen, destino…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "0.625rem 1rem", fontSize: "0.9rem",
              fontFamily: "inherit", color: "#1e293b",
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              background: "#fff", transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📦</div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {q ? "Sin resultados para esa búsqueda." : "No hay leads disponibles en este momento."}
            </p>
          </div>
        ) : (
          <div className="leads-grid">
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => navigate("/proveedor/leads/" + lead.id)}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        {leads.length > 0 && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem 1.25rem", fontSize: "0.75rem", color: "#94a3b8" }}>
            <span><span style={{ color: "#ca8a04", fontWeight: 600 }}>NUEVA</span> — nunca visto</span>
            <span><span style={{ color: "#16a34a", fontWeight: 600 }}>DISPONIBLE</span> — visto, sin cotizar</span>
            <span><span style={{ color: "#94a3b8", fontWeight: 600 }}>COTIZADA 🔒</span> — ya cotizaste</span>
            <span><span style={{ color: "#94a3b8", fontWeight: 600 }}>ADJUDICADA 🔒</span> — asignada a otro</span>
          </div>
        )}
      </div>
    </>
  );
}
