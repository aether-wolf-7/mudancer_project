import { useState, useMemo, useEffect } from "react";
import { verCotizaciones, marcarInteres } from "../../api/clienteApi";

const ADMIN_WA    = (import.meta.env.VITE_WHATSAPP_ADMIN ?? "").replace(/\D/g, "") || "5219992709881";
const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL ?? "").trim() || "https://link.mercadopago.com.mx/mudatodo";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMoney(val) {
  if (!val && val !== 0) return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Stars({ value, max = 5, size = 15 }) {
  const n = Math.round(Number(value) || 0);
  return (
    <span style={{ color: "#f59e0b", letterSpacing: -1, fontSize: size }}>
      {"★".repeat(n)}{"☆".repeat(Math.max(0, max - n))}
      <span style={{ color: "#9ca3af", fontSize: size * 0.8, marginLeft: 3 }}>{n}/{max}</span>
    </span>
  );
}

function ProviderAvatar({ logo, nombre, size = 52 }) {
  const initial = (nombre || "?")[0].toUpperCase();
  if (logo) {
    return (
      <img src={logo} alt={nombre}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#e5e7eb", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 700, fontSize: size * 0.36,
      color: "#6b7280", flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

function buildWhatsAppUrl(lead, quote) {
  if (!ADMIN_WA) return null;
  const provNombre = quote?.provider?.nombre ?? "el proveedor";
  const precio = quote?.precio_total ? fmtMoney(quote.precio_total) : "";
  const leadId = lead?.lead_id ?? "";
  const msg = encodeURIComponent(
    `Hola, me interesa la propuesta de ${provNombre}${precio ? ` por ${precio}` : ""} para mi mudanza.\nID de solicitud: ${leadId}\nPor favor, ¿cómo procedo con el apartado?`
  );
  return `https://wa.me/${ADMIN_WA}?text=${msg}`;
}

function buildPaymentUrl(lead, quote) {
  if (!PAYMENT_URL) return null;
  const url = new URL(PAYMENT_URL);
  if (lead?.lead_id) url.searchParams.set("lead_id", lead.lead_id);
  if (quote?.id) url.searchParams.set("quote_id", quote.id);
  if (quote?.apartado) url.searchParams.set("amount", quote.apartado);
  return url.toString();
}

const CARD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Payment confirmation modal ─────────────────────────────────────────────────

function PaymentConfirmModal({ quote, onCancel }) {
  const p = quote.provider;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <>
      <style>{`@keyframes mh-slide-up{from{transform:translateY(64px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        }}
      />
      {/* Sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9001,
        background: "#fff", borderRadius: "20px 20px 0 0",
        maxWidth: 480, margin: "0 auto",
        padding: "0 20px 32px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        animation: "mh-slide-up 0.22s ease-out",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "14px auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: "#111827", margin: "0 0 6px" }}>
            Confirmar pago del apartado
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Serás redirigido a MercadoPago para completar el pago de forma segura.
          </p>
        </div>

        {/* Summary card */}
        <div style={{
          background: "#f0fdf4", border: "1.5px solid #86efac",
          borderRadius: 14, padding: "16px 18px", marginBottom: 18,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Empresa</span>
            <span style={{ fontSize: 14, color: "#111827", fontWeight: 700 }}>{p?.nombre ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Total del servicio</span>
            <span style={{ fontSize: 14, color: "#111827", fontWeight: 700 }}>{fmtMoney(quote.precio_total)}</span>
          </div>
          <div style={{
            borderTop: "1px solid #bbf7d0", paddingTop: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, color: "#15803d", fontWeight: 700 }}>Apartado a pagar ahora</span>
            <span style={{ fontSize: 22, color: "#15803d", fontWeight: 800 }}>{fmtMoney(quote.apartado)}</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "0 0 18px", lineHeight: 1.5 }}>
          Anticipo ({fmtMoney(quote.anticipo)}) el día de recolección ·
          Pago final ({fmtMoney(quote.pago_final)}) al llegar a destino.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Direct link — user gesture, works on mobile */}
          <a
            href={PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCancel}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "15px 0", borderRadius: 14,
              background: "#009ee3", color: "#fff",
              fontSize: 16, fontWeight: 800, textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Pagar con MercadoPago
          </a>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14,
              border: "1.5px solid #e5e7eb", background: "#fff",
              color: "#6b7280", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

// ── Lead detail modal ──────────────────────────────────────────────────────────

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: "0.07em",
        margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{icon}</span> {title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, value, wide = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: "#111827", fontWeight: 500, margin: 0, lineHeight: 1.45 }}>
        {value}
      </p>
    </div>
  );
}

function LocationCard({ color, accent, label, city, colonia, state, piso, elevador, acarreo }) {
  const address = [city, colonia, state].filter(Boolean).join(", ");
  const yn = (v) => (v ? "✅ Sí" : "❌ No");
  return (
    <div style={{ background: color, borderRadius: 12, padding: "12px 14px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
        📍 {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px", lineHeight: 1.35 }}>
        {address || "—"}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {piso      && <span style={{ fontSize: 12, color: "#6b7280" }}>Piso / nivel: {piso}</span>}
        {elevador != null && <span style={{ fontSize: 12, color: "#6b7280" }}>Elevador: {yn(elevador)}</span>}
        {acarreo   && <span style={{ fontSize: 12, color: "#6b7280" }}>Acarreo: {acarreo}</span>}
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const images = lead.imagenes_urls ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      />
      {/* Sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 8001,
        background: "#fff", borderRadius: "20px 20px 0 0",
        maxWidth: 540, margin: "0 auto",
        maxHeight: "92dvh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        animation: "mh-slide-up 0.22s ease-out",
      }}>
        {/* Sticky header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 1, background: "#fff",
          padding: "14px 18px 12px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>
              Solicitud #{lead.lead_id ?? "—"}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>
              {lead.nombre_cliente ?? "Mi solicitud"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, border: "none",
              background: "#f3f4f6", color: "#6b7280", fontSize: 20,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >×</button>
        </div>

        <div style={{ padding: "20px 18px 44px" }}>

          {/* ── Ruta ── */}
          <Section icon="🗺️" title="Ruta de mudanza">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 18px 1fr", gap: 8, alignItems: "start" }}>
              <LocationCard
                color="#f0fdf4" accent="#16a34a" label="Origen"
                city={lead.localidad_origen} colonia={lead.colonia_origen} state={lead.estado_origen}
                piso={lead.piso_origen} elevador={lead.elevador_origen} acarreo={lead.acarreo_origen}
              />
              <div style={{ paddingTop: 20, textAlign: "center", color: "#9ca3af", fontSize: 15, fontWeight: 700 }}>→</div>
              <LocationCard
                color="#fef2f2" accent="#dc2626" label="Destino"
                city={lead.localidad_destino} colonia={lead.colonia_destino} state={lead.estado_destino}
                piso={lead.piso_destino} elevador={lead.elevador_destino} acarreo={lead.acarreo_destino}
              />
            </div>
          </Section>

          {/* ── Servicio ── */}
          <Section icon="🚚" title="Detalles del servicio">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#f9fafb", borderRadius: 12, padding: "14px 16px" }}>
              <Field label="Fecha de recolección" value={lead.fecha_recoleccion ? fmtDate(lead.fecha_recoleccion) : null} />
              <Field label="Fecha de entrega"     value={lead.fecha_entrega     ? fmtDate(lead.fecha_entrega)     : null} />
              <Field label="Tiempo estimado"      value={lead.tiempo_estimado} />
              <Field label="Modalidad"            value={lead.modalidad} />
              <Field label="Empaque / embalaje"   value={lead.empaque} />
              <Field label="Seguro declarado"     value={lead.seguro ? fmtMoney(lead.seguro) : null} />
            </div>
          </Section>

          {/* ── Inventario ── */}
          {(lead.inventario || lead.articulos_delicados) && (
            <Section icon="📦" title="Inventario">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lead.inventario && (
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                      Lista de artículos
                    </p>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {lead.inventario}
                    </p>
                  </div>
                )}
                {lead.articulos_delicados && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                      ⚠️ Artículos pesados / delicados
                    </p>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
                      {lead.articulos_delicados}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Imágenes del inventario ── */}
          {images.length > 0 && (
            <Section icon="📷" title="Fotos del inventario">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {images.map((url, i) => {
                  const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", display: "block", background: "#f3f4f6", position: "relative" }}
                    >
                      {isVideo ? (
                        <>
                          <video src={url} muted playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.28)", fontSize: 24 }}>▶</div>
                        </>
                      ) : (
                        <img src={url} alt={`Foto ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                    </a>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Observaciones ── */}
          {lead.observaciones && (
            <Section icon="📝" title="Observaciones">
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {lead.observaciones}
                </p>
              </div>
            </Section>
          )}

          {/* ── Términos del servicio ── */}
          <div style={{ borderTop: "1.5px solid #f3f4f6", paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Incluye */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, background: "#22c55e",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#15803d", margin: 0 }}>El servicio incluye</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Salvo previo acuerdo y especificado en las observaciones.</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7 }}>
                Maniobras de carga, descarga, acarreo hasta 30 mts. y pisos especificados en la carátula. Protección básica con empleado de sus muebles de tela (colchones, sillones, sillas, etc.) y de sus piezas más delicadas. Protección con colchonetas. Traslado en la modalidad de servicio especificado en la carátula de la cotización.
              </p>
            </div>

            {/* No incluye */}
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, background: "#ef4444",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#dc2626", margin: 0 }}>El servicio no incluye</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Salvo previo acuerdo y especificado en las observaciones.</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7 }}>
                Voladuras, empaques, cajas, roperos, acomodo de cristalería, maniobras especiales, desarmados y/o armados especiales, carga de muebles llenos, acarreos más de 30 mts, trabajos de electricidad, plomería, jardinería, albañilería, trabajos especiales, manejos y cargos aduanales, rejas de madera, demoras, almacenajes, colgado de cuadros y/o espejos o decoraciones, empaque y desempaque de cajas, desempotrar muebles incrustados en la pared, seguro de carga, permisos municipales y/o sindicales, estadías por demora para entrega atribuible al cliente, y ningún servicio no contemplado en este presupuesto.
              </p>
            </div>

            {/* Artículos prohibidos */}
            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, background: "#f59e0b",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                <p style={{ fontWeight: 800, fontSize: 14, color: "#92400e", margin: 0 }}>Artículos prohibidos en las mudanzas</p>
              </div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7 }}>
                Drogas, narcóticos, armas o municiones, joyas, dinero en efectivo, bonos, animales, plantas protegidas, personas. En caso de que el cliente incluya en su menaje alguno de los artículos mencionados con anterioridad o algún otro ilegal o que perjudique a nuestra empresa, se hará responsable de todo lo que pudiese resultar a nivel legal y económico, y deslindará a la empresa de mudanzas de cualquier acción legal y no legal que pudiese existir.
              </p>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

// ── Pending screen ─────────────────────────────────────────────────────────────

function PendingScreen({ onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
      <h2 style={{ fontWeight: 700, fontSize: 20, color: "#111827", margin: "0 0 12px" }}>
        Solicitud recibida
      </h2>
      <p style={{
        fontSize: 15, color: "#4b5563", lineHeight: 1.6,
        background: "#fef3c7", borderRadius: 12, padding: "14px 18px",
        border: "1px solid #fcd34d", margin: "0 0 24px",
      }}>
        Tu solicitud fue recibida, pero <strong>aún no ha sido aprobada</strong>.<br />
        Por favor espera — esto puede tardar hasta <strong>8 horas</strong>.
      </p>
      <button onClick={onReset} style={{
        padding: "10px 24px", borderRadius: 10,
        border: "1.5px solid #e5e7eb", background: "#fff",
        color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>
        ← Volver
      </button>
    </div>
  );
}

// ── Sort bar ───────────────────────────────────────────────────────────────────

function SortBar({ sort, onChange, total }) {
  const opts = [
    { key: "precio-asc", label: "💰 Menor precio" },
    { key: "precio-desc", label: "💎 Mayor precio" },
    { key: "reputacion-desc", label: "⭐ Mejor reputación" },
  ];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {total} propuesta{total !== 1 ? "s" : ""} disponible{total !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Ordenar por:</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {opts.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1.5px solid",
              borderColor: sort === key ? "#22c55e" : "#e5e7eb",
              background: sort === key ? "#f0fdf4" : "#fff",
              color: sort === key ? "#16a34a" : "#6b7280",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Quote card ─────────────────────────────────────────────────────────────────

function QuoteCard({ quote, lead, rank, isCheapest, isBestRated, cheapestPrice, onSelect, selecting }) {
  const p = quote.provider;
  const isInterested = quote.cliente_interesada;
  const [showWA, setShowWA] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const waUrl = buildWhatsAppUrl(lead, quote);

  const priceDiff = cheapestPrice !== null && !isCheapest
    ? quote.precio_total - cheapestPrice
    : null;

  function handleSelect() {
    if (selecting || isInterested) return;
    onSelect(quote, () => setShowWA(true));
  }

  // Card border / highlight
  const borderColor = isInterested ? "#22c55e" : isCheapest ? "#16a34a" : "#e5e7eb";
  const borderWidth = isInterested || isCheapest ? 2 : 1.5;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: isCheapest && !isInterested
        ? "0 2px 14px rgba(22,163,74,0.13)"
        : isInterested
          ? "0 2px 14px rgba(34,197,94,0.18)"
          : "0 1px 4px rgba(0,0,0,0.06)",
      overflow: "hidden",
      transition: "box-shadow 0.18s",
    }}>
      {/* ── Badge bar ── */}
      {(isCheapest || isBestRated || isInterested) && (
        <div style={{
          display: "flex", gap: 6, padding: "7px 14px",
          background: isInterested ? "#f0fdf4" : isCheapest ? "#dcfce7" : "#fef3c7",
          borderBottom: `1px solid ${isInterested ? "#bbf7d0" : isCheapest ? "#86efac" : "#fcd34d"}`,
          flexWrap: "wrap",
        }}>
          {isInterested && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.04em" }}>
              ✓ SELECCIONADA
            </span>
          )}
          {isCheapest && !isInterested && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", letterSpacing: "0.04em" }}>
              🏆 MEJOR PRECIO
            </span>
          )}
          {isBestRated && !isCheapest && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", letterSpacing: "0.04em" }}>
              ⭐ MEJOR REPUTACIÓN
            </span>
          )}
          {isBestRated && isCheapest && !isInterested && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", letterSpacing: "0.04em" }}>
              ⭐ MEJOR REPUTACIÓN
            </span>
          )}
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* ── Provider header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <ProviderAvatar logo={p?.logo} nombre={p?.nombre ?? "?"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p?.nombre ?? "Empresa de mudanzas"}
            </p>
            <Stars value={p?.reputacion ?? 0} />
          </div>
          {/* Position rank */}
          <span style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: rank === 1 ? "#22c55e" : rank === 2 ? "#f59e0b" : "#e5e7eb",
            color: rank <= 2 ? "#fff" : "#9ca3af",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
          }}>
            {rank}
          </span>
        </div>

        {/* ── Price box ── */}
        <div style={{
          background: isCheapest ? "#f0fdf4" : "#f9fafb",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 12,
          border: isCheapest ? "1px solid #bbf7d0" : "1px solid #f0f0f0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
              <p style={{ fontSize: 26, fontWeight: 800, color: isCheapest ? "#16a34a" : "#111827", margin: 0, lineHeight: 1.1 }}>
                {fmtMoney(quote.precio_total)}
              </p>
              {priceDiff !== null && (
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                  +{fmtMoney(priceDiff)} vs. el más económico
                </span>
              )}
            </div>
            {/* Payment schedule summary */}
            <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af", lineHeight: 1.7 }}>
              <div>Apartado: <span style={{ color: "#374151", fontWeight: 600 }}>{fmtMoney(quote.apartado)}</span></div>
              <div>Anticipo: <span style={{ color: "#374151", fontWeight: 600 }}>{fmtMoney(quote.anticipo)}</span></div>
              <div>Al llegar: <span style={{ color: "#374151", fontWeight: 600 }}>{fmtMoney(quote.pago_final)}</span></div>
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        {quote.notas && (
          <p style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", margin: "0 0 12px", lineHeight: 1.5 }}>
            "{quote.notas}"
          </p>
        )}

        {/* ── Download PDF ── */}
        {lead?.public_token && (
          <a
            href={`${window.location.origin}/api/cliente/quotes/${quote.id}/pdf?token=${lead.public_token}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "9px 0", borderRadius: 10, marginBottom: 10,
              background: "#f1f5f9", color: "#1e3a5f",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              border: "1px solid #e2e8f0", boxSizing: "border-box",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            📄 Ver Cotización PDF
          </a>
        )}

        {/* ── Actions ── */}
        {!isInterested ? (
          <button
            onClick={handleSelect}
            disabled={selecting}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12,
              border: "none",
              background: selecting ? "#86efac" : isCheapest ? "#16a34a" : "#22c55e",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: selecting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {selecting ? "Guardando…" : "Me interesa esta propuesta"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#15803d", margin: "0 0 6px" }}>
                ✅ PROPUESTA SELECCIONADA
              </p>
              <p style={{ fontSize: 13, color: "#166534", margin: "0 0 8px", lineHeight: 1.5 }}>
                Para reservar esta cotización, realiza el pago del <strong>apartado y notifícalo por whatsapp</strong> para elaborar la orden de servicio.
              </p>
              <div style={{ background: "#dcfce7", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Apartado a pagar:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmtMoney(quote.apartado)}</span>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "6px 0 0", lineHeight: 1.4 }}>
                El anticipo ({fmtMoney(quote.anticipo)}) se cubre el día de la recolección.
                El pago final ({fmtMoney(quote.pago_final)}) se realiza a la llegada a destino.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPayConfirm(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                background: "#009ee3", color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxSizing: "border-box", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#007ec6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#009ee3"; }}
            >
              {CARD_ICON}
              Pagar Apartado
            </button>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "13px 0", borderRadius: 12,
                  background: "#25d366", color: "#fff",
                  fontSize: 15, fontWeight: 700, textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                {WA_ICON}
                Contactar por WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {showPayConfirm && (
        <PaymentConfirmModal quote={quote} onCancel={() => setShowPayConfirm(false)} />
      )}
    </div>
  );
}

// ── Quotes screen ──────────────────────────────────────────────────────────────

function QuotesScreen({ lead, quotes, onReset }) {
  const [localQuotes, setLocalQuotes] = useState(quotes);
  const [selecting, setSelecting]     = useState(null);
  const [error, setError]             = useState(null);
  const [sort, setSort]               = useState("precio-asc");
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  // Sort & compute derived values
  const sorted = useMemo(() => {
    const arr = [...localQuotes];
    if (sort === "precio-asc") arr.sort((a, b) => a.precio_total - b.precio_total);
    else if (sort === "precio-desc") arr.sort((a, b) => b.precio_total - a.precio_total);
    else if (sort === "reputacion-desc") arr.sort((a, b) => (b.provider?.reputacion ?? 0) - (a.provider?.reputacion ?? 0));
    return arr;
  }, [localQuotes, sort]);

  const cheapestId = useMemo(() => {
    if (!localQuotes.length) return null;
    return localQuotes.reduce((a, b) => a.precio_total < b.precio_total ? a : b).id;
  }, [localQuotes]);

  const cheapestPrice = useMemo(() => {
    if (!localQuotes.length) return null;
    return Math.min(...localQuotes.map((q) => Number(q.precio_total)));
  }, [localQuotes]);

  const bestRatedId = useMemo(() => {
    if (!localQuotes.length) return null;
    return localQuotes.reduce((a, b) =>
      (a.provider?.reputacion ?? 0) >= (b.provider?.reputacion ?? 0) ? a : b
    ).id;
  }, [localQuotes]);

  async function handleSelect(quote, onDone) {
    setError(null);
    setSelecting(quote.id);
    try {
      await marcarInteres(quote.id);
      setLocalQuotes((prev) => prev.map((q) => ({ ...q, cliente_interesada: q.id === quote.id })));
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al guardar tu preferencia.");
    } finally {
      setSelecting(null);
    }
  }

  const origin = [lead.localidad_origen, lead.estado_origen].filter(Boolean).join(", ");
  const dest = [lead.localidad_destino, lead.estado_destino].filter(Boolean).join(", ");

  return (
    <div>
      {/* ── Lead summary — click to open detail modal ── */}
      <button
        type="button"
        onClick={() => setShowLeadDetail(true)}
        style={{
          display: "block", width: "100%", textAlign: "left",
          background: "#f9fafb", borderRadius: 14, padding: "14px 16px",
          marginBottom: 20, border: "1px solid #e5e7eb",
          cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#86efac"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: "0 0 6px" }}>
              {lead.nombre_cliente}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>📍 {origin || "—"}</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>→</span>
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>📍 {dest || "—"}</span>
            </div>
            {lead.fecha_recoleccion && (
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                Fecha ideal: {fmtDate(lead.fecha_recoleccion)}
              </p>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
            Ver detalle →
          </span>
        </div>
      </button>

      {showLeadDetail && (
        <LeadDetailModal lead={lead} onClose={() => setShowLeadDetail(false)} />
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {localQuotes.length === 0 ? (
        <div style={{
          background: "#f0f9ff", border: "1.5px solid #bae6fd",
          borderRadius: 16, padding: "28px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: "#0369a1", margin: "0 0 8px" }}>
            ¡Tu solicitud fue aprobada!
          </p>
          <p style={{ fontSize: 14, color: "#0c4a6e", margin: "0 0 6px", lineHeight: 1.6 }}>
            Estamos buscando las mejores empresas de mudanza para tu servicio.
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Las propuestas aparecerán aquí en cuanto las empresas las envíen.<br />
            Por favor regresa en unas horas.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sort bar ── */}
          <SortBar sort={sort} onChange={setSort} total={sorted.length} />

          {/* ── Price range summary ── */}
          {sorted.length > 1 && (
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
              padding: "10px 14px", marginBottom: 14,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Rango de precios:
                <span style={{ fontWeight: 700, color: "#16a34a", marginLeft: 4 }}>{fmtMoney(cheapestPrice)}</span>
                <span style={{ color: "#d1d5db", margin: "0 6px" }}>—</span>
                <span style={{ fontWeight: 700, color: "#374151" }}>{fmtMoney(Math.max(...localQuotes.map((q) => Number(q.precio_total))))}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Diferencia:
                <span style={{ fontWeight: 700, color: "#ef4444", marginLeft: 4 }}>
                  {fmtMoney(Math.max(...localQuotes.map((q) => Number(q.precio_total))) - cheapestPrice)}
                </span>
              </div>
            </div>
          )}

          {/* ── Quote cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sorted.map((quote, idx) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                lead={lead}
                rank={idx + 1}
                isCheapest={quote.id === cheapestId}
                isBestRated={quote.id === bestRatedId}
                cheapestPrice={cheapestPrice}
                selecting={selecting === quote.id}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* ── Comparison tip ── */}
          <div style={{
            marginTop: 18, padding: "10px 14px", borderRadius: 12,
            background: "#fffbeb", border: "1px solid #fde68a",
            fontSize: 12, color: "#92400e", lineHeight: 1.6,
          }}>
            💡 <strong>Consejo:</strong> El precio no lo es todo. Considera también la reputación de la empresa y lee las notas de cada propuesta antes de decidir.
          </div>
        </>
      )}

      <button
        onClick={onReset}
        style={{
          display: "block", width: "100%", marginTop: 24,
          padding: "11px 0", borderRadius: 12,
          border: "1.5px solid #e5e7eb", background: "#fff",
          color: "#6b7280", fontSize: 14, fontWeight: 500, cursor: "pointer",
        }}
      >
        ← Volver al inicio
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Cotizacion() {
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screen, setScreen] = useState("login"); // 'login' | 'pending' | 'quotes'
  const [result, setResult] = useState(null);

  function handleReset() {
    setScreen("login");
    setTelefono("");
    setError(null);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const raw = telefono.replace(/\D/g, "");
    if (raw.length !== 10) {
      setError("El número de teléfono debe tener 10 dígitos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await verCotizaciones(raw);
      if (data.status === "not_found") {
        setError(data.message || "No encontramos ninguna solicitud con ese número.");
      } else if (data.status === "pending") {
        setScreen("pending");
      } else if (data.status === "published") {
        setResult({ lead: data.lead, quotes: data.quotes ?? [] });
        setScreen("quotes");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al buscar tu solicitud.");
    } finally {
      setLoading(false);
    }
  }

  const phoneValid = telefono.replace(/\D/g, "").length === 10;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",
      padding: "0 0 40px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        maxWidth: "100%",
      }}>
        {/* Logo — left */}
        <img
          src="/mudancer-logo.png?v=3"
          alt="Mudancer"
          style={{
            height: "clamp(40px, 8vw, 58px)",
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* WhatsApp contact button — right */}
        <a
          href={(() => {
            const lead = result?.lead;
            const msg = lead
              ? `Hola, soy ${lead.nombre_cliente ?? "cliente"} y tengo una pregunta sobre mi solicitud de mudanza (ID: ${lead.lead_id ?? "—"}). ¿Me pueden ayudar con los detalles o solicitar cambios?`
              : "Hola, tengo una pregunta sobre mi solicitud de mudanza. ¿Me pueden ayudar?";
            return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
          })()}
          target="_blank"
          rel="noopener noreferrer"
          title="Contactar al gestor por WhatsApp"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#25d366", color: "#fff",
            padding: "8px 14px", borderRadius: 24,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1db954"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#25d366"; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span style={{ whiteSpace: "nowrap" }}>Contactar</span>
        </a>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Login screen ── */}
        {screen === "login" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <img
                  src="/mudancer-logo.png?v=3"
                  alt="Mudancer"
                  style={{
                    width: "clamp(78px, 29vw, 117px)",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <h1 style={{ fontWeight: 700, fontSize: 22, color: "#111827", margin: "0 0 8px" }}>
                Ver mis cotizaciones
        </h1>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                Ingresa el número de teléfono que proporcionaste al solicitar tu mudanza y compara las propuestas de las empresas.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Número de teléfono (10 dígitos)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
                placeholder="Ej: 9991234567"
            value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setError(null);
                }}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: error ? "1.5px solid #f87171" : "1.5px solid #e5e7eb",
                  fontSize: 17, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", letterSpacing: "0.1em",
                  color: "#111827", background: "#fff",
                }}
            autoComplete="tel"
          />
              {error && <p style={{ fontSize: 13, color: "#dc2626", margin: "6px 0 0" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !phoneValid}
                style={{
                  width: "100%", marginTop: 14, padding: "14px 0", borderRadius: 12,
                  border: "none",
                  background: (loading || !phoneValid) ? "#86efac" : "#22c55e",
                  color: "#fff", fontSize: 16, fontWeight: 700,
                  cursor: (loading || !phoneValid) ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Buscando…" : "Consultar cotizaciones"}
          </button>
        </form>

            <p style={{ textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 28 }}>
              Tu número de teléfono es tu identificador único de solicitud.
            </p>
                    </div>
        )}

        {/* ── Pending screen ── */}
        {screen === "pending" && <PendingScreen onReset={handleReset} />}

        {/* ── Quotes screen ── */}
        {screen === "quotes" && result && (
          <QuotesScreen
            lead={result.lead}
            quotes={result.quotes}
            onReset={handleReset}
          />
        )}

      </div>
    </div>
  );
}
