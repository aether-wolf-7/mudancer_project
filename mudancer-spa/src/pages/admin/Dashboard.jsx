import { useState, useEffect, useRef, useCallback } from "react";
import { getLeads } from "../../api/adminApi";
import LeadModal from "./LeadModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// ── Lead Card ─────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick, isNew }) {
  const createdDate = fmtDate(lead.created_at);
  const idealDate   = fmtDate(lead.ideal_date);
  const origin      = [lead.origin_city, lead.origin_state].filter(Boolean).join(", ") || "—";
  const destination = [lead.destination_city, lead.destination_state].filter(Boolean).join(", ") || "—";

  return (
    <div
      onClick={onClick}
      style={{
        background:   isNew ? "#f0fdf4" : "#fff",
        borderRadius: 14,
        border:       isNew ? "2px solid #22c55e" : "1.5px solid #e5e7eb",
        padding:      "0.875rem 1rem",
        cursor:       "pointer",
        transition:   "box-shadow 0.18s, transform 0.15s",
        boxShadow:    isNew ? "0 2px 12px rgba(34,197,94,0.18)" : "0 1px 4px rgba(0,0,0,0.06)",
        display:      "flex",
        flexDirection:"column",
        gap:          "0.375rem",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isNew ? "0 2px 12px rgba(34,197,94,0.18)" : "0 1px 4px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Row 1: NEW badge + created date + ideal date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          {isNew && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "#22c55e", color: "#fff", borderRadius: 20, padding: "2px 8px", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              NUEVO
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{createdDate}</span>
        </div>
        {idealDate !== "—" && (
          <span style={{ fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" }}>
            📅 {idealDate}
          </span>
        )}
      </div>

      {/* Row 2: Client name */}
      <p style={{
        margin: 0,
        fontWeight: 700,
        fontSize: "0.9375rem",
        color: "#1e293b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {lead.client_name || "—"}
      </p>

      {/* Row 3: Origin → Destination */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
        <span style={{
          background: "#f0fdf4", color: "#15803d",
          border: "1px solid #bbf7d0",
          borderRadius: 6, padding: "2px 8px",
          fontSize: "0.78rem", fontWeight: 500,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "calc(50% - 1rem)",
        }}>
          📍 {origin}
        </span>
        <span style={{ color: "#9ca3af", fontSize: "0.75rem", flexShrink: 0 }}>→</span>
        <span style={{
          background: "#fef2f2", color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: 6, padding: "2px 8px",
          fontSize: "0.78rem", fontWeight: 500,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "calc(50% - 1rem)",
        }}>
          🏁 {destination}
        </span>
      </div>

      {/* Row 4: Phone (if available) */}
      {lead.client_phone && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#374151", fontWeight: 600 }}>
          📞 {lead.client_phone}
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [allLeads, setAllLeads]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const debounceRef = useRef(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    setError(null);
    getLeads()
      .then(setAllLeads)
      .catch((err) => setError(err.response?.data?.message || err.message || "Error loading leads"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function handleSearchInput(value) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 350);
  }

  // When a lead is saved/published inside the modal, refresh the list
  function handleLeadUpdated(updatedLead, action) {
    if (action === "published") {
      // Lead was published → remove from New Leads list
      setAllLeads((prev) => prev.filter((l) => l.id !== updatedLead.id));
      setSelectedLeadId(null);
    } else {
      // Just updated — refresh card
      setAllLeads((prev) =>
        prev.map((l) =>
          l.id === updatedLead.id
            ? {
                ...l,
                client_name: updatedLead.nombre_cliente || updatedLead.client_name,
                origin_state: updatedLead.estado_origen || updatedLead.origin_state,
                origin_city: updatedLead.localidad_origen || updatedLead.origin_city,
                destination_state: updatedLead.estado_destino || updatedLead.destination_state,
                destination_city: updatedLead.localidad_destino || updatedLead.destination_city,
                ideal_date: updatedLead.fecha_recoleccion || updatedLead.ideal_date,
                is_new: updatedLead.is_new ?? false,
              }
            : l
        )
      );
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = allLeads.filter((l) => {
    if (!q) return true;
    return (
      (l.client_name  || "").toLowerCase().includes(q) ||
      (l.public_id    || "").toLowerCase().includes(q) ||
      (l.origin_state || "").toLowerCase().includes(q) ||
      (l.origin_city  || "").toLowerCase().includes(q) ||
      (l.destination_state || "").toLowerCase().includes(q) ||
      (l.destination_city  || "").toLowerCase().includes(q)
    );
  });

  const newCount = allLeads.filter(l => l.is_new).length;

  return (
    <>
      {/* Responsive grid CSS */}
      <style>{`
        .admin-leads-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.625rem;
        }
        @media (min-width: 640px) {
          .admin-leads-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .admin-leads-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .admin-leads-search:focus {
          outline: none;
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem 1rem 2.5rem" }}>

        {/* Title */}
        <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1e293b", margin: "0 0 1rem", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          Nuevos Leads
          {newCount > 0 && (
            <span style={{ background: "#22c55e", color: "#fff", borderRadius: 20, fontSize: "0.7rem", padding: "3px 10px", fontWeight: 700, letterSpacing: "0.04em" }}>
              {newCount} nuevo{newCount !== 1 ? "s" : ""}
            </span>
          )}
        </h1>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
          <input
            className="admin-leads-search"
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Buscar por nombre, origen, destino…"
            style={{
              width: "100%", padding: "0.625rem 2.5rem 0.625rem 0.875rem",
              fontSize: "0.9rem", fontFamily: "inherit",
              border: "1.5px solid #e5e7eb", borderRadius: 10,
              color: "#1e293b", background: "#fff",
              boxSizing: "border-box", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#22c55e")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
          />
          <span style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>Cargando leads…
          </div>
        ) : error ? (
          <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "1rem", textAlign: "center" }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {q ? `Sin resultados para "${search}"` : "No hay nuevos leads aún."}
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#94a3b8" }}>
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="admin-leads-grid">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isNew={!!lead.is_new}
                  onClick={() => setSelectedLeadId(lead.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Lead detail modal */}
        {selectedLeadId !== null && (
          <LeadModal
            leadId={selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
            onLeadUpdated={handleLeadUpdated}
          />
        )}
      </div>
    </>
  );
}
