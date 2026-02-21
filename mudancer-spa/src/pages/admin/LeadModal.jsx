import { useState, useEffect, useCallback } from "react";
import { getLead, updateLead, publishLead, adjudicarLead, concluirLead } from "../../api/adminApi";

// ── Small helpers ────────────────────────────────────────────────────────────

function fmtCurrency(val) {
  if (val === null || val === undefined || val === "") return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 48,
        height: 26,
        borderRadius: 13,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#22c55e" : "#d1d5db",
        transition: "background 0.2s",
        padding: 0,
        flexShrink: 0,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: checked ? 24 : 2,
          top: 2,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontWeight: 500 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Input({ value, onChange, name, type = "text", placeholder = "", required, maxLength, pattern, style }) {
  return (
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      maxLength={maxLength}
      pattern={pattern}
      style={{
        width: "100%",
        padding: "8px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 14,
        color: "#111827",
        outline: "none",
        background: "#f9fafb",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

function Textarea({ value, onChange, name, rows = 3, placeholder = "" }) {
  return (
    <textarea
      name={name}
      value={value ?? ""}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 14,
        color: "#111827",
        outline: "none",
        background: "#f9fafb",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontWeight: 600, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "18px 0 10px", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
      {children}
    </p>
  );
}

// ── Confirmation dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
          maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
        <h3 style={{ fontWeight: 700, fontSize: 17, color: "#111827", margin: "0 0 8px" }}>
          Publish this lead?
        </h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 22px", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#f9fafb",
              color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: "none", background: "#22c55e",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

const EDITABLE_FIELDS = [
  "nombre_cliente", "email_cliente", "telefono_cliente",
  "estado_origen", "localidad_origen", "colonia_origen", "piso_origen",
  "elevador_origen", "acarreo_origen",
  "estado_destino", "localidad_destino", "colonia_destino", "piso_destino",
  "elevador_destino", "acarreo_destino",
  "empaque", "fecha_recoleccion", "fecha_entrega", "tiempo_estimado", "modalidad",
  "seguro", "inventario", "articulos_delicados", "observaciones",
];

const ADMIN_WA = (import.meta.env.VITE_WHATSAPP_ADMIN ?? "").replace(/\D/g, "");

function buildClientWaUrl(lead) {
  if (!lead?.telefono_cliente) return null;
  const phone = lead.telefono_cliente.replace(/\D/g, "");
  const intl  = phone.length === 10 ? `521${phone}` : phone;
  const msg   = encodeURIComponent(
    `Hola ${lead.nombre_cliente ?? ""}, le contactamos de Mudancer respecto a su solicitud de mudanza (ID: ${lead.lead_id ?? lead.id}). ¿Podría confirmar los detalles de su mudanza?`
  );
  return `https://wa.me/${intl}?text=${msg}`;
}

export default function LeadModal({ leadId, onClose, onLeadUpdated }) {
  const [lead, setLead]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchLead = useCallback(() => {
    setLoading(true);
    getLead(leadId)
      .then((data) => setLead(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setLead((prev) => prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : null);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!lead) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {};
      EDITABLE_FIELDS.forEach((k) => { if (lead[k] !== undefined) payload[k] = lead[k]; });
      const updated = await updateLead(leadId, payload);
      if (updated) {
        setLead(updated);
        setSuccess("Lead updated successfully.");
        onLeadUpdated?.(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function doPublish() {
    setShowConfirm(false);
    setPublishing(true);
    setError(null);
    try {
      const { lead: updated, url } = await publishLead(leadId);
      if (updated) {
        setLead({ ...updated, public_url: url || updated.public_url });
        setSuccess("Lead published! It is now visible on the Quotes page.");
        onLeadUpdated?.(updated, "published");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleToggleAdjudicada(val) {
    if (!val || !lead) return;
    setError(null);
    try {
      const updated = await adjudicarLead(leadId);
      if (updated) { setLead(updated); onLeadUpdated?.(updated); }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  async function handleToggleConcluida(val) {
    if (!val || !lead) return;
    setError(null);
    try {
      const updated = await concluirLead(leadId);
      if (updated) { setLead(updated); onLeadUpdated?.(updated); }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  const displayId = lead?.public_id || lead?.lead_id || lead?.id || leadId;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(460px, 100vw)",
          zIndex: 1001,
          background: "#fff",
          overflowY: "auto",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "#fff",
            padding: "16px 20px 12px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>
            LEAD/{displayId}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* WhatsApp button — contact client directly */}
            {lead && buildClientWaUrl(lead) && (
              <a
                href={buildClientWaUrl(lead)}
                target="_blank"
                rel="noopener noreferrer"
                title="Contact client via WhatsApp"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 8,
                  background: "#25D366", color: "#fff",
                  textDecoration: "none", fontSize: 18, flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                background: "#f3f4f6", border: "none", borderRadius: 8,
                width: 32, height: 32, cursor: "pointer", fontSize: 18,
                color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 20px 32px" }}>
          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af" }}>
              Loading…
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", color: "#16a34a", fontSize: 13, marginBottom: 14 }}>
              {success}
            </div>
          )}

          {lead && (
            <form onSubmit={handleSave}>
              {/* ── Customer ── */}
              <FieldBlock label="Customer Name">
                <Input name="nombre_cliente" value={lead.nombre_cliente} onChange={handleChange} required placeholder="Full name" />
              </FieldBlock>

              <FieldBlock label="Email">
                <Input name="email_cliente" type="email" value={lead.email_cliente} onChange={handleChange} required placeholder="email@example.com" />
              </FieldBlock>

              <FieldBlock label="Phone">
                <Input name="telefono_cliente" value={lead.telefono_cliente} onChange={handleChange} maxLength={10} placeholder="10 digits" />
              </FieldBlock>

              {/* ── Origin ── */}
              <SectionTitle>Origin</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldBlock label="State">
                  <Input name="estado_origen" value={lead.estado_origen} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="City">
                  <Input name="localidad_origen" value={lead.localidad_origen} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Neighborhood">
                  <Input name="colonia_origen" value={lead.colonia_origen} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Floor">
                  <Input name="piso_origen" value={lead.piso_origen} onChange={handleChange} placeholder="e.g. Ground" />
                </FieldBlock>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}>
                  <input type="checkbox" name="elevador_origen" checked={!!lead.elevador_origen} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "#22c55e" }} />
                  Elevator at origin
                </label>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontWeight: 500 }}>Acarreo origen</p>
                  <Input name="acarreo_origen" type="text" value={lead.acarreo_origen ?? ""} onChange={handleChange} placeholder="e.g. A menos de 30 mts." />
                </div>
              </div>

              {/* ── Destination ── */}
              <SectionTitle>Destination</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldBlock label="State">
                  <Input name="estado_destino" value={lead.estado_destino} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="City">
                  <Input name="localidad_destino" value={lead.localidad_destino} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Neighborhood">
                  <Input name="colonia_destino" value={lead.colonia_destino} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Floor">
                  <Input name="piso_destino" value={lead.piso_destino} onChange={handleChange} placeholder="e.g. Ground" />
                </FieldBlock>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}>
                  <input type="checkbox" name="elevador_destino" checked={!!lead.elevador_destino} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "#22c55e" }} />
                  Elevator at destination
                </label>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontWeight: 500 }}>Acarreo destino</p>
                  <Input name="acarreo_destino" type="text" value={lead.acarreo_destino ?? ""} onChange={handleChange} placeholder="e.g. Acarreo de 30 a 40 mts." />
                </div>
              </div>

              {/* ── Service details ── */}
              <SectionTitle>Service</SectionTitle>
              <FieldBlock label="Packing">
                <Input name="empaque" value={lead.empaque} onChange={handleChange} placeholder="Packing type" />
              </FieldBlock>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FieldBlock label="Fecha de Recolección">
                  <Input name="fecha_recoleccion" type="date" value={lead.fecha_recoleccion ?? ""} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Fecha de Llegada a Destino">
                  <Input name="fecha_entrega" type="date" value={lead.fecha_entrega ?? ""} onChange={handleChange} />
                </FieldBlock>
                <FieldBlock label="Horario estimado">
                  <Input name="tiempo_estimado" value={lead.tiempo_estimado} onChange={handleChange} placeholder="e.g. 3–6 días" />
                </FieldBlock>
              </div>

              <FieldBlock label="Modality">
                <Input name="modalidad" value={lead.modalidad} onChange={handleChange} placeholder="Service modality" />
              </FieldBlock>

              <FieldBlock label="Insurance Value ($)">
                <Input name="seguro" type="number" value={lead.seguro} onChange={handleChange} placeholder="0.00" />
              </FieldBlock>

              {/* ── Inventory & observations ── */}
              <SectionTitle>Inventory &amp; Notes</SectionTitle>
              <FieldBlock label="Inventory">
                <Textarea name="inventario" value={lead.inventario} onChange={handleChange} rows={4} placeholder="List of items…" />
              </FieldBlock>

              <FieldBlock label="Heavy / Delicate Items">
                <Input name="articulos_delicados" value={lead.articulos_delicados} onChange={handleChange} placeholder="e.g. Stone furniture" />
              </FieldBlock>

              <FieldBlock label="Observations">
                <Textarea name="observaciones" value={lead.observaciones} onChange={handleChange} rows={3} placeholder="Any special notes…" />
              </FieldBlock>

              {/* ── Public URL (when published) ── */}
              {lead.publicada && lead.public_url && (
                <>
                  <SectionTitle>Public Link</SectionTitle>
                  <div
                    style={{
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      borderRadius: 10, padding: "10px 14px",
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🔗</span>
                    <a
                      href={lead.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#16a34a", fontSize: 13, wordBreak: "break-all", fontFamily: "monospace" }}
                    >
                      {lead.public_url}
                    </a>
                  </div>
                </>
              )}

              {/* ── Save button ── */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  background: saving ? "#86efac" : "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: saving ? "not-allowed" : "pointer",
                  marginTop: 8,
                  marginBottom: 24,
                  transition: "background 0.2s",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>

              {/* ── Toggle switches ── */}
              <div
                style={{
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Publish */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#374151", margin: 0 }}>Publish</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                      {lead.publicada
                        ? "Published — visible on Quotes page"
                        : "Move this lead to the Quotes page"}
                    </p>
                  </div>
                  <Toggle
                    checked={!!lead.publicada}
                    disabled={!!lead.publicada || publishing}
                    onChange={(val) => { if (val) setShowConfirm(true); }}
                  />
                </div>

                {/* Mark as awarded */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#374151", margin: 0 }}>Mark as awarded</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                      {lead.adjudicada ? "Awarded" : "A supplier has been selected"}
                    </p>
                  </div>
                  <Toggle
                    checked={!!lead.adjudicada}
                    disabled={!!lead.adjudicada}
                    onChange={handleToggleAdjudicada}
                  />
                </div>

                {/* Mark as completed */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#374151", margin: 0 }}>Mark as completed</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                      {lead.concluida ? "Completed" : "Moving job finished"}
                    </p>
                  </div>
                  <Toggle
                    checked={!!lead.concluida}
                    disabled={!!lead.concluida}
                    onChange={handleToggleConcluida}
                  />
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Publish confirmation dialog */}
      {showConfirm && (
        <ConfirmDialog
          message="This lead will be moved to the Quotes page and a unique public link will be generated. This action cannot be undone."
          onConfirm={doPublish}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
