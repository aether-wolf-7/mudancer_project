/**
 * LeadRedirect — handles public lead URLs: /leads/:leadId/:token
 *
 * Flow:
 *  1. Resolve internal lead id via public API endpoint
 *  2a. If provider token exists → navigate directly to /proveedor/leads/:id
 *  2b. If no token → save target in localStorage, redirect to /proveedor/login
 *
 * The provider Login page picks up the saved redirect and navigates there after login.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getProviderToken } from "../api/proveedorClient";

const BASE = (import.meta.env.VITE_API_URL ?? "").trim()
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
  : "/api";

export const PROVIDER_REDIRECT_KEY = "provider_redirect_after_login";

export default function LeadRedirect() {
  const { leadId, token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const res = await axios.get(`${BASE}/leads/link/${leadId}/${token}`, {
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;

        const internalId = res.data.id;
        const target = `/proveedor/leads/${internalId}`;

        if (getProviderToken()) {
          navigate(target, { replace: true });
        } else {
          localStorage.setItem(PROVIDER_REDIRECT_KEY, target);
          navigate("/proveedor/login", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            "Este enlace no es válido o ya no está disponible."
          );
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [leadId, token, navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f9fafb",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: 24,
      }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: "32px 24px",
          maxWidth: 380, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: "0 0 10px" }}>
            Enlace no válido
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 20px" }}>
            {error}
          </p>
          <button
            onClick={() => navigate("/proveedor/login")}
            style={{
              padding: "11px 28px", borderRadius: 10,
              background: "#22c55e", color: "#fff",
              border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Ir al panel de proveedor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f9fafb",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, border: "4px solid #e5e7eb",
          borderTopColor: "#22c55e", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ fontSize: 15, color: "#6b7280" }}>Cargando solicitud…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
