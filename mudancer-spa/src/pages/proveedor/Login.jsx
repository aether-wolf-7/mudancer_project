import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/proveedorApi";
import { setProviderToken } from "../../api/proveedorClient";
import { PROVIDER_REDIRECT_KEY } from "../LeadRedirect";

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        minWidth: "260px",
        maxWidth: "90vw",
        padding: "0.875rem 1.25rem",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        background: isSuccess ? "#d1fae5" : "#fee2e2",
        color: isSuccess ? "#065f46" : "#991b1b",
        border: `1px solid ${isSuccess ? "#6ee7b7" : "#fca5a5"}`,
        fontWeight: 600,
        fontSize: "0.9375rem",
        textAlign: "center",
        animation: "fadeInDown 0.3s ease",
      }}
    >
      {isSuccess ? "✓ " : "⚠ "}
      {message}
    </div>
  );
}

// ── Login page ────────────────────────────────────────────────────────────────

export default function ProveedorLogin() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast]               = useState({ message: "", type: "" });
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  function showToast(message, type = "error") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      showToast("El correo es requerido.", "error");
      return;
    }
    if (!password) {
      showToast("La contraseña es requerida.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      setProviderToken(res.token);
      showToast("Sesión iniciada. Redirigiendo…", "success");
      const redirect = localStorage.getItem(PROVIDER_REDIRECT_KEY);
      setTimeout(() => {
        if (redirect) {
          localStorage.removeItem(PROVIDER_REDIRECT_KEY);
          navigate(redirect, { replace: true });
        } else {
          navigate("/proveedor/dashboard", { replace: true });
        }
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Credenciales incorrectas. Intenta de nuevo.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .pv-input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          font-family: inherit;
          color: #1e293b;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pv-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.18);
        }
        .pv-input::placeholder { color: #94a3b8; }
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 1.125rem;
          padding: 0;
          line-height: 1;
        }
        .pw-toggle:hover { color: #64748b; }
        .btn-proveedor {
          width: 100%;
          padding: 1rem;
          font-size: 1.0625rem;
          font-weight: 700;
          font-family: inherit;
          color: #fff;
          background: #2563eb;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: 0.01em;
        }
        .btn-proveedor:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
        }
        .btn-proveedor:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      <Toast message={toast.message} type={toast.type} />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          padding: "1.5rem 1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            background: "#f8fafc",
            borderRadius: "24px",
            padding: "2.5rem 2rem 2rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <img
              src="/mudancer-logo.png?v=3"
              alt="Mudancer"
              style={{
                width: "clamp(120px, 45vw, 180px)",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
            <p
              style={{
                marginTop: "0.875rem",
                fontSize: "0.875rem",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Accede para gestionar leads y cotizaciones
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Email */}
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pv-input"
                placeholder="correo@  proveedor.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <div className="pw-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pv-input"
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-proveedor"
              disabled={loading}
              style={{ marginTop: "0.5rem" }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
