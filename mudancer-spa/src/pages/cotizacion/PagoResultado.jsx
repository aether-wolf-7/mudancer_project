import { useSearchParams, Link } from "react-router-dom";

const ADMIN_WA = (import.meta.env.VITE_WHATSAPP_ADMIN ?? "").replace(/\D/g, "") || "5219992709881";

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CARD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const LOGO = (
  <img
    src="/mudancer-logo.png?v=3"
    alt="Mudancer"
    style={{ height: 54, width: "auto", objectFit: "contain", display: "block" }}
  />
);

// ── Shared layout ──────────────────────────────────────────────────────────────

function ResultPage({ icon, iconBg, title, subtitle, summaryBg, summaryBorder, summary, actions }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f9fafb",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {LOGO}
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
      }}>
        <div style={{
          width: "100%", maxWidth: 420,
          background: "#fff", borderRadius: 20,
          border: `2px solid ${summaryBorder}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          padding: "32px 24px 28px",
          textAlign: "center",
        }}>
          {/* Icon circle */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: iconBg, margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38,
          }}>
            {icon}
          </div>

          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#111827", margin: "0 0 8px" }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 22px", lineHeight: 1.6 }}>
            {subtitle}
          </p>

          {/* Summary card */}
          <div style={{
            background: summaryBg, border: `1px solid ${summaryBorder}`,
            borderRadius: 14, padding: "16px 18px",
            marginBottom: 22, textAlign: "left",
          }}>
            {summary}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions}
          </div>

          <Link
            to="/cotizacion"
            style={{
              display: "block", marginTop: 14,
              fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 500,
            }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Pago Exitoso ───────────────────────────────────────────────────────────────

export function PagoExitoso() {
  const [params] = useSearchParams();
  const paymentId     = params.get("payment_id") || params.get("collection_id");
  const status        = params.get("status") || params.get("collection_status");
  const merchantOrder = params.get("merchant_order_id");

  const waText = encodeURIComponent(
    "Hola, acabo de realizar el pago del apartado de mi mudanza. ¿Pueden confirmar la recepción y coordinar los siguientes pasos?"
  );

  return (
    <ResultPage
      icon="✅"
      iconBg="#dcfce7"
      title="¡Pago recibido!"
      subtitle="Tu apartado fue procesado correctamente. Ya estás un paso más cerca de tu mudanza."
      summaryBg="#f0fdf4"
      summaryBorder="#86efac"
      summary={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
            Detalles del pago
          </p>
          {paymentId && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>ID de pago</span>
              <span style={{ fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>{paymentId}</span>
            </div>
          )}
          {merchantOrder && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Orden</span>
              <span style={{ fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>{merchantOrder}</span>
            </div>
          )}
          {status && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Estado</span>
              <span style={{ fontWeight: 700, color: "#16a34a", textTransform: "capitalize" }}>{status}</span>
            </div>
          )}
          <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.5 }}>
            Nuestro equipo se pondrá en contacto contigo para coordinar los siguientes pasos de tu mudanza.
          </p>
        </div>
      }
      actions={
        ADMIN_WA && (
          <a
            href={`https://wa.me/${ADMIN_WA}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "#25d366", color: "#fff",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            {WA_ICON} Avisar por WhatsApp
          </a>
        )
      }
    />
  );
}

// ── Pago Fallido ───────────────────────────────────────────────────────────────

export function PagoFallido() {
  const [params] = useSearchParams();
  const status = params.get("status") || params.get("collection_status");

  return (
    <ResultPage
      icon="❌"
      iconBg="#fee2e2"
      title="Pago no completado"
      subtitle="Hubo un problema al procesar tu pago. Puedes intentarlo de nuevo cuando gustes."
      summaryBg="#fef2f2"
      summaryBorder="#fca5a5"
      summary={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            ¿Qué pudo haber pasado?
          </p>
          {[
            "Fondos insuficientes en la tarjeta.",
            "La tarjeta fue rechazada por el banco.",
            "Se canceló el proceso de pago.",
            "Error temporal en MercadoPago.",
          ].map((item) => (
            <div key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: "#6b7280" }}>
              <span style={{ flexShrink: 0 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
          {status && (
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "6px 0 0" }}>
              Estado reportado: <strong>{status}</strong>
            </p>
          )}
        </div>
      }
      actions={
        <a
          href="https://link.mercadopago.com.mx/mudatodo"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 0", borderRadius: 12,
            background: "#009ee3", color: "#fff",
            fontSize: 15, fontWeight: 700, textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          {CARD_ICON} Intentar pago de nuevo
        </a>
      }
    />
  );
}

// ── Pago Pendiente ─────────────────────────────────────────────────────────────

export function PagoPendiente() {
  const waText = encodeURIComponent(
    "Hola, realicé un pago de apartado pero aparece como pendiente. ¿Pueden verificarlo?"
  );

  return (
    <ResultPage
      icon="⏳"
      iconBg="#fef3c7"
      title="Pago en proceso"
      subtitle="Tu pago está siendo verificado. Esto puede tardar unos minutos."
      summaryBg="#fffbeb"
      summaryBorder="#fcd34d"
      summary={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, margin: 0 }}>
            MercadoPago está procesando tu pago. Una vez confirmado, nuestro equipo se pondrá en contacto contigo.
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0", lineHeight: 1.5 }}>
            Si tienes dudas, contáctanos por WhatsApp.
          </p>
        </div>
      }
      actions={
        ADMIN_WA && (
          <a
            href={`https://wa.me/${ADMIN_WA}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "#25d366", color: "#fff",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            {WA_ICON} Contactar soporte
          </a>
        )
      }
    />
  );
}
