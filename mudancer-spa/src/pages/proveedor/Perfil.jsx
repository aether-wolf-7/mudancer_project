import { useState, useEffect } from "react";
import { getPerfil } from "../../api/proveedorApi";

function Stars({ value = 0 }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= value ? "#f59e0b" : "#d1d5db", fontSize: 18 }}>★</span>
      ))}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 15, color: "#111827", fontWeight: 500 }}>
        {value || <span style={{ color: "#d1d5db" }}>—</span>}
      </p>
    </div>
  );
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPerfil()
      .then(setPerfil)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh", color: "#94a3b8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
          Cargando perfil…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 12, padding: "1rem", fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!perfil) return null;

  const initials = (perfil.nombre || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 520, margin: "0 auto" }}>
      {/* Header card */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        padding: "24px 20px",
        marginBottom: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}>
        {perfil.logo ? (
          <img
            src={perfil.logo}
            alt={perfil.nombre}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#16a34a,#15803d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 22, flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {perfil.nombre}
          </p>
          <Stars value={perfil.reputacion || 0} />
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
            {perfil.reputacion ? `${perfil.reputacion} / 5 estrellas` : "Sin reputación aún"}
          </p>
        </div>
      </div>

      {/* Details card */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        padding: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Datos de la empresa
        </p>
        <Field label="Nombre" value={perfil.nombre} />
        <Field label="Correo electrónico" value={perfil.email} />
        <Field label="Teléfono" value={perfil.telefono} />
        <Field label="RFC" value={perfil.rfc} />
        <Field label="Dirección" value={perfil.direccion} />
        <Field label="Responsable" value={perfil.responsable} />
      </div>

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
        Para actualizar tu información, contacta al administrador.
      </p>
    </div>
  );
}
