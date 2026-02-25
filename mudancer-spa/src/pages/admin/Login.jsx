import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/adminApi";
import { setAdminToken } from "../../api/client";

// ── helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(identifier, password) {
  const errors = {};

  if (!identifier.trim()) {
    errors.identifier = "Username or email is required. Please register first.";
  } else if (identifier.includes("@") && !EMAIL_RE.test(identifier)) {
    errors.identifier = "Please enter a valid email address format (e.g. admin@example.com).";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  return errors;
}

// ── Toast component ───────────────────────────────────────────────────────────

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

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [toast, setToast]               = useState({ message: "", type: "" });
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  function showToast(message, type = "error") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});

    // ── client-side validation ──────────────────────────────────────────────
    const errors = validate(identifier, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier, password);
      setAdminToken(res.token);

      showToast("Login successful! Redirecting…", "success");
      setTimeout(() => navigate("/admin/dashboard", { replace: true }), 1200);
    } catch (err) {
      const data = err.response?.data;

      // Laravel validation errors (422)
      if (data?.errors) {
        const serverErrors = {};
        if (data.errors.identifier) serverErrors.identifier = data.errors.identifier[0];
        if (data.errors.password)   serverErrors.password   = data.errors.password[0];
        setFieldErrors(serverErrors);
        showToast(data.message || "Please fix the errors below.", "error");
      } else {
        // 401 wrong credentials or other
        const msg = data?.message || err.message || "Login failed. Please try again.";
        setFieldErrors({ identifier: msg });
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .login-input {
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
        .login-input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
        }
        .login-input.has-error {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.12);
        }
        .login-input::placeholder { color: #94a3b8; }
        .field-error {
          margin-top: 0.375rem;
          font-size: 0.8125rem;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
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
        .btn-next {
          width: 100%;
          padding: 1rem;
          font-size: 1.0625rem;
          font-weight: 700;
          font-family: inherit;
          color: #fff;
          background: #22c55e;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: 0.01em;
        }
        .btn-next:hover:not(:disabled) {
          background: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(34,197,94,0.4);
        }
        .btn-next:disabled {
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
          {/* Logo */}
          <div
            style={{
              display: "flex",
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Username / Email */}
            <div>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: "" }));
                }}
                className={`login-input${fieldErrors.identifier ? " has-error" : ""}`}
                placeholder="Username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
              {fieldErrors.identifier && (
                <p className="field-error">
                  <span>⚠</span> {fieldErrors.identifier}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="pw-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  className={`login-input${fieldErrors.password ? " has-error" : ""}`}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="field-error">
                  <span>⚠</span> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="btn-next" disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? "Signing in…" : "Next"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
