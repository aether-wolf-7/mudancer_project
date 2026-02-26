import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getLead, submitQuote } from "../../api/proveedorApi";

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMXN(val) {
  if (!val && val !== 0) return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

// ── Commission table ──────────────────────────────────────────────────────────
function calcCommission(price) {
  if (price <= 5000)   return 1500;
  if (price <= 10000)  return 2000;
  if (price <= 15000)  return 2500;
  if (price <= 20000)  return 3000;
  if (price <= 25000)  return 3500;
  if (price <= 30000)  return 4000;
  if (price <= 35000)  return 4500;
  if (price <= 40000)  return 5000;
  if (price <= 45000)  return 5500;
  if (price <= 50000)  return 6000;
  if (price <= 55000)  return 6500;
  if (price <= 60000)  return 7000;
  if (price <= 65000)  return 7500;
  if (price <= 70000)  return 8000;
  if (price <= 75000)  return 8500;
  if (price <= 80000)  return 9000;
  if (price <= 85000)  return 9500;
  if (price <= 90000)  return 10000;
  if (price <= 95000)  return 10500;
  if (price <= 100000) return 11000;
  if (price <= 110000) return 12000;
  if (price <= 120000) return 12500;
  if (price <= 130000) return 15000;
  if (price <= 150000) return 18000;
  if (price <= 200000) return 25000;
  if (price <= 300000) return 30000;
  if (price <= 400000) return 40000;
  if (price <= 500000) return 45000;
  return 50000;
}

function calcQuote(precioProveedor, seguro) {
  const comision     = calcCommission(precioProveedor);
  const tarifaSeguro = seguro > 0 ? Math.round(seguro * 0.015 * 100) / 100 : 0;
  const precioTotal  = Math.round((precioProveedor + comision + tarifaSeguro) * 100) / 100;
  const apartado     = comision;
  const mitad        = Math.round(((precioProveedor + tarifaSeguro) / 2) * 100) / 100;
  const anticipo     = mitad;
  const pagoFinal    = Math.round((precioTotal - apartado - mitad) * 100) / 100;
  return { comision, tarifaSeguro, precioTotal, apartado, anticipo, pagoFinal };
}

const PROPOSAL_NAMES = ["Servicio Exclusivo", "Servicio Compartido"];
const MAX_PROPOSALS = 2;

function makeProposal(index) {
  return {
    nombre_propuesta: PROPOSAL_NAMES[index] ?? `Propuesta ${index + 1}`,
    precio_proveedor: "",
    notas: "",
  };
}

// ── Single proposal card ──────────────────────────────────────────────────────
function ProposalCard({ index, proposal, onChange, onRemove, canRemove, seguro }) {
  const precio      = parseFloat(proposal.precio_proveedor);
  const precioValid = !isNaN(precio) && precio > 0;

  const calc = useMemo(() => {
    if (!precioValid) return null;
    return calcQuote(precio, seguro ?? 0);
  }, [precio, precioValid, seguro]);

  function set(key, val) { onChange(index, { ...proposal, [key]: val }); }

  const labelNum = ["①", "②"][index] ?? `${index + 1}`;

  return (
    <div style={{
      background: "#f8fafc",
      border: "1.5px solid #e2e8f0",
      borderRadius: 14,
      padding: "1rem",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem" }}>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e5a9e" }}>
          {labelNum} Propuesta {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 6, color: "#dc2626", fontSize: "0.75rem", padding: "2px 8px", cursor: "pointer", flexShrink: 0 }}
          >
            Eliminar
          </button>
        )}
      </div>

      {/* Proposal name */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
          Nombre de la propuesta
        </label>
        <input
          type="text"
          value={proposal.nombre_propuesta}
          onChange={(e) => set("nombre_propuesta", e.target.value)}
          maxLength={80}
          placeholder="ej. Servicio Exclusivo"
          style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem", fontSize: "0.875rem", border: "1.5px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none" }}
        />
      </div>

      {/* Price */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
          Tu precio por el servicio (sin comisión) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={proposal.precio_proveedor}
          onChange={(e) => set("precio_proveedor", e.target.value)}
          placeholder="0.00"
          required
          style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem", fontSize: "0.9375rem", border: "1.5px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none" }}
        />
        <p style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
          La comisión de mudancer.com se calculará automáticamente.
        </p>
      </div>

      {/* Quote preview */}
      {calc && (
        <div style={{ background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "0.75rem", marginBottom: "0.75rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.68rem", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Resumen de la cotización
          </p>

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#374151" }}>
              <span>Tu precio</span>
              <span>{fmtMXN(precio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#374151" }}>
              <span>Comisión mudancer.com</span>
              <span style={{ color: "#d97706" }}>+ {fmtMXN(calc.comision)}</span>
            </div>
            {calc.tarifaSeguro > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#374151" }}>
                <span>Tarifa de seguro (1.5%)</span>
                <span style={{ color: "#1d4ed8" }}>+ {fmtMXN(calc.tarifaSeguro)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 800, color: "#15803d", borderTop: "1px solid #e2e8f0", paddingTop: 4, marginTop: 2 }}>
              <span>Total al cliente</span>
              <span>{fmtMXN(calc.precioTotal)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <p style={{ margin: "0 0 0.375rem", fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Calendario de pagos del cliente
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.25rem", textAlign: "center" }}>
            {[
              ["Apartado", calc.apartado, "#d97706"],
              ["Anticipo", calc.anticipo, "#1d4ed8"],
              ["Al llegar", calc.pagoFinal, "#15803d"],
            ].map(([lbl, v, clr]) => (
              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 8, padding: "4px 2px" }}>
                <p style={{ margin: 0, fontSize: "0.62rem", color: "#94a3b8" }}>{lbl}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: clr }}>{fmtMXN(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-proposal notes */}
      <div>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
          Nota de esta propuesta <span style={{ color: "#94a3b8", textTransform: "none", fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea
          value={proposal.notas}
          onChange={(e) => set("notas", e.target.value)}
          rows={2}
          placeholder="Condiciones especiales, restricciones, aclaraciones para el cliente…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem",
            fontSize: "0.875rem", border: "1.5px solid #e2e8f0", borderRadius: 8,
            fontFamily: "inherit", color: "#1e293b", resize: "vertical",
            outline: "none", minHeight: 60, background: "#fff",
          }}
        />
      </div>

    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [sent, setSent]         = useState(false);

  // Multi-proposal state
  const [proposals, setProposals] = useState([makeProposal(0)]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLead(id)
      .then((data) => { if (!cancelled) setLead(data); })
      .catch((err)  => { if (!cancelled) setFetchError(err.message); })
      .finally(()   => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  function updateProposal(index, updated) {
    setProposals((prev) => prev.map((p, i) => i === index ? updated : p));
  }

  function addProposal() {
    if (proposals.length < MAX_PROPOSALS) setProposals((prev) => [...prev, makeProposal(prev.length)]);
  }

  function removeProposal(index) {
    setProposals((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    setSent(false);

    try {
      for (const proposal of proposals) {
        const precio = parseFloat(proposal.precio_proveedor);
        if (isNaN(precio) || precio <= 0) throw new Error(`Precio inválido en "${proposal.nombre_propuesta}".`);

        const body = {
          precio_proveedor:  precio,
          nombre_propuesta:  proposal.nombre_propuesta.trim() || null,
          notas:             proposal.notas.trim() || null,
        };

        await submitQuote(id, body);
      }

      setSent(true);
      setProposals([makeProposal(0)]);
      setLead((prev) => prev ? { ...prev, my_quotes_count: (prev.my_quotes_count ?? 0) + proposals.length, can_quote: false, supplier_state: "cotizada" } : null);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || "Error al enviar cotización");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: "2rem 1rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <p style={{ color: "#94a3b8" }}>Cargando…</p>
    </div>
  );

  if (fetchError && !lead) return (
    <div style={{ padding: "1rem" }}>
      <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>{fetchError}</div>
      <Link to="/proveedor/dashboard" style={{ color: "#1e5a9e", fontWeight: 600, textDecoration: "none" }}>← Volver a LEADS</Link>
    </div>
  );

  if (!lead) return null;

  return (
    <>
      <style>{`
        .ld-section { background:#fff; border-radius:14px; border:1.5px solid #e5e7eb; padding:1rem; margin-bottom:1rem; }
        .ld-dl { display:grid; grid-template-columns:auto 1fr; gap:0.25rem 0.75rem; font-size:0.875rem; }
        .ld-dt { color:#94a3b8; font-weight:500; white-space:nowrap; padding:0.125rem 0; }
        .ld-dd { color:#1e293b; font-weight:500; padding:0.125rem 0; margin:0; word-break:break-word; }
        @media(min-width:640px) {
          .ld-section { padding:1.5rem; }
          .ld-dl { grid-template-columns:160px 1fr; }
        }
        .ld-pill-origin { background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:6px;padding:2px 10px;font-size:0.78rem;font-weight:600;white-space:nowrap; }
        .ld-pill-dest   { background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;padding:2px 10px;font-size:0.78rem;font-weight:600;white-space:nowrap; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.25rem 1rem 3rem" }}>

        <Link to="/proveedor/dashboard" style={{ color: "#1e5a9e", fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: "1rem", fontSize: "0.875rem" }}>
          ← Volver a Leads
        </Link>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "1.25rem", color: "#1e293b" }}>
            {lead.nombre_cliente}
          </h1>
          {lead.supplier_state && (
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", padding: "2px 10px", borderRadius: 20,
              background: lead.supplier_state === "nueva" ? "#fef9c3" : lead.supplier_state === "disponible" ? "#dcfce7" : "#f1f5f9",
              color: lead.supplier_state === "nueva" ? "#854d0e" : lead.supplier_state === "disponible" ? "#166534" : "#64748b",
              border: `1px solid ${lead.supplier_state === "nueva" ? "#fde047" : lead.supplier_state === "disponible" ? "#86efac" : "#cbd5e1"}`,
            }}>
              {lead.supplier_state?.toUpperCase()}
            </span>
          )}
        </div>

        {/* ── Client ── */}
        <div className="ld-section">
          <h2 style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.875rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Cliente</h2>
          <dl className="ld-dl">
            <dt className="ld-dt">Nombre</dt>
            <dd className="ld-dd">{lead.nombre_cliente}</dd>
          </dl>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.5rem 0.75rem", marginTop: "0.75rem" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>🔒</span>
            <span style={{ fontSize: "0.78rem", color: "#92400e" }}>
              El teléfono y email del cliente estarán disponibles una vez que el servicio te sea adjudicado.
            </span>
          </div>
        </div>

        {/* ── Origin ── */}
        <div className="ld-section">
          <h2 style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.875rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Origen</h2>
          <dl className="ld-dl">
            <dt className="ld-dt">Estado</dt>       <dd className="ld-dd">{lead.estado_origen || "—"}</dd>
            <dt className="ld-dt">Localidad</dt>    <dd className="ld-dd">{lead.localidad_origen || "—"}</dd>
            <dt className="ld-dt">Colonia</dt>      <dd className="ld-dd">{lead.colonia_origen || "—"}</dd>
            <dt className="ld-dt">Piso / Nivel</dt> <dd className="ld-dd">{lead.piso_origen || "—"}</dd>
            <dt className="ld-dt">Elevador</dt>     <dd className="ld-dd">{lead.elevador_origen ? "Sí" : "No"}</dd>
            <dt className="ld-dt">Acarreo</dt>      <dd className="ld-dd">{lead.acarreo_origen || "Hasta 30 mts."}</dd>
          </dl>
        </div>

        {/* ── Destination ── */}
        <div className="ld-section">
          <h2 style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.875rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Destino</h2>
          <dl className="ld-dl">
            <dt className="ld-dt">Estado</dt>       <dd className="ld-dd">{lead.estado_destino || "—"}</dd>
            <dt className="ld-dt">Localidad</dt>    <dd className="ld-dd">{lead.localidad_destino || "—"}</dd>
            <dt className="ld-dt">Colonia</dt>      <dd className="ld-dd">{lead.colonia_destino || "—"}</dd>
            <dt className="ld-dt">Piso / Nivel</dt> <dd className="ld-dd">{lead.piso_destino || "—"}</dd>
            <dt className="ld-dt">Elevador</dt>     <dd className="ld-dd">{lead.elevador_destino ? "Sí" : "No"}</dd>
            <dt className="ld-dt">Acarreo</dt>      <dd className="ld-dd">{lead.acarreo_destino || "Hasta 30 mts."}</dd>
          </dl>
        </div>

        {/* ── Service details ── */}
        <div className="ld-section">
          <h2 style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.875rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Detalles del Servicio</h2>
          <dl className="ld-dl">
            <dt className="ld-dt">Recolección</dt>  <dd className="ld-dd">{formatDate(lead.fecha_recoleccion)}</dd>
            <dt className="ld-dt">Llegada</dt>      <dd className="ld-dd">{lead.fecha_entrega ? formatDate(lead.fecha_entrega) : lead.tiempo_estimado || "Acordar"}</dd>
            <dt className="ld-dt">Modalidad</dt>    <dd className="ld-dd">{lead.modalidad || "—"}</dd>
            <dt className="ld-dt">Empaque</dt>      <dd className="ld-dd">{lead.empaque || "—"}</dd>
            {lead.seguro > 0 && (<>
              <dt className="ld-dt">Seguro</dt>
              <dd className="ld-dd" style={{ color: "#1d4ed8", fontWeight: 700 }}>{fmtMXN(lead.seguro)}</dd>
            </>)}
            {lead.inventario && (<>
              <dt className="ld-dt">Inventario</dt>
              <dd className="ld-dd" style={{ whiteSpace: "pre-line" }}>{lead.inventario}</dd>
            </>)}
            {lead.articulos_delicados && (<>
              <dt className="ld-dt">Art. delicados</dt>
              <dd className="ld-dd">{lead.articulos_delicados}</dd>
            </>)}
            {lead.observaciones && (<>
              <dt className="ld-dt">Observaciones</dt>
              <dd className="ld-dd">{lead.observaciones}</dd>
            </>)}
          </dl>
        </div>

        {/* ── Quote sent success ── */}
        {sent && (
          <div style={{ background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: 14, padding: "1.25rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>✅</span>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1rem", color: "#15803d" }}>
                ¡Tu cotización ha sido enviada!
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534" }}>
                El administrador revisará tu propuesta. Si es seleccionada, recibirás una notificación y podrás ver el servicio en <strong>Órdenes</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Already quoted ── */}
        {!sent && lead.my_quotes_count > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#15803d", fontWeight: 500 }}>
            ✓ Ya enviaste {lead.my_quotes_count} cotización{lead.my_quotes_count > 1 ? "es" : ""} para este lead.
          </div>
        )}

        {/* ── Locked notices ── */}
        {lead.can_quote === false && lead.supplier_state === "adjudicada" && (
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 14, padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🔒</span>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "#475569" }}>Lead adjudicada</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>Este lead fue asignado a otro proveedor. No es posible cotizar, pero puedes consultarlo como referencia.</p>
            </div>
          </div>
        )}

        {lead.can_quote === false && lead.supplier_state === "cotizada" && !sent && (
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 14, padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🔒</span>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "#475569" }}>Ya cotizaste este lead</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>Tu cotización ya fue enviada. Revisa tus <strong>Órdenes</strong> si fue adjudicada.</p>
            </div>
          </div>
        )}

        {/* ── Multi-proposal quote form ── */}
        {lead.can_quote !== false && !sent && (
          <form onSubmit={handleSubmit}>
            <div className="ld-section" style={{ marginBottom: "1rem" }}>
              <h2 style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.875rem", color: "#1e293b", letterSpacing: "0.01em" }}>
                Cotizar — Envía hasta 2 propuestas
              </h2>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                Puedes enviar una o dos opciones. Ej: Servicio Exclusivo o Servicio Compartido.
              </p>

              {/* Proposals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {proposals.map((proposal, i) => (
                  <ProposalCard
                    key={i}
                    index={i}
                    proposal={proposal}
                    onChange={updateProposal}
                    onRemove={removeProposal}
                    canRemove={proposals.length > 1}
                    seguro={lead.seguro}
                  />
                ))}
              </div>

              {/* Add proposal button */}
              {proposals.length < MAX_PROPOSALS && (
                <button
                  type="button"
                  onClick={addProposal}
                  style={{
                    width: "100%", padding: "0.625rem", border: "1.5px dashed #93c5fd",
                    borderRadius: 10, background: "#eff6ff", color: "#1d4ed8",
                    fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    marginBottom: "1rem", transition: "background 0.15s",
                  }}
                >
                  + Agregar segunda propuesta ({proposals.length}/{MAX_PROPOSALS})
                </button>
              )}

              {/* Submit error */}
              {submitError && (
                <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                  ⚠ {submitError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "0.875rem", fontSize: "1rem", fontWeight: 700,
                  fontFamily: "inherit", color: "#fff",
                  background: submitting ? "#86efac" : "#22c55e",
                  border: "none", borderRadius: 12,
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 3px 12px rgba(34,197,94,0.3)",
                  transition: "background 0.2s",
                }}
              >
                {submitting
                  ? "Enviando…"
                  : proposals.length === 1
                  ? "Ofrece tu mejor precio"
                  : `Enviar ${proposals.length} propuestas`}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
