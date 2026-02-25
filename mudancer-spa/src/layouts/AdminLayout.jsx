import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { getAdminToken, setAdminToken } from "../api/client";

// ── LEADS dropdown items ──────────────────────────────────────────────────────
const LEADS_ITEMS = [
  { label: "New Leads", to: "/admin/leads"     },
  { label: "Quotes",    to: "/admin/cotizadas"  },
  { label: "Orders",    to: "/admin/orders"     },
];

// ── Desktop dropdown ──────────────────────────────────────────────────────────
function LeadsDropdown({ location }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive =
    location.pathname.startsWith("/admin/leads") ||
    location.pathname.startsWith("/admin/cotizadas") ||
    location.pathname.startsWith("/admin/orders");

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "0.5rem 1rem", borderRadius: 8, border: "none",
          background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
          color: isActive ? "#16a34a" : "#374151",
          fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
          fontFamily: "inherit", transition: "background 0.15s, color 0.15s",
          letterSpacing: "0.04em",
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f3f4f6"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        LEADS
        <span style={{
          fontSize: "0.65rem", display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s",
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb", minWidth: 160,
          zIndex: 200, overflow: "hidden", animation: "ddFade 0.15s ease",
        }}>
          {LEADS_ITEMS.map(({ label, to }) => {
            const active =
              location.pathname === to ||
              (to !== "/admin/leads" && location.pathname.startsWith(to));
            return (
              <Link
                key={to} to={to}
                onClick={() => setOpen(false)}
                style={{
                  display: "block", padding: "0.625rem 1.125rem",
                  fontSize: "0.875rem", fontWeight: active ? 600 : 500,
                  color: active ? "#16a34a" : "#374151",
                  textDecoration: "none",
                  background: active ? "rgba(34,197,94,0.08)" : "transparent",
                  borderLeft: active ? "3px solid #22c55e" : "3px solid transparent",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLogin = location.pathname === "/admin/login";
  const token   = getAdminToken();

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  function handleLogout() {
    setAdminToken(null);
    window.location.href = "/admin/login";
  }

  if (isLogin || !token) return <Outlet />;

  const suppliersActive = location.pathname.startsWith("/admin/providers");

  const navLinkStyle = (active) => ({
    display: "block",
    padding: "0.75rem 1.125rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.9375rem",
    color: active ? "#16a34a" : "#374151",
    background: active ? "rgba(34,197,94,0.10)" : "transparent",
    textDecoration: "none",
    letterSpacing: "0.03em",
    transition: "background 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes ddFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes mobileMenuSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Desktop nav — visible ≥ 640 px */
        .admin-desktop-nav { display: flex; }
        .admin-hamburger    { display: none; }
        .admin-mobile-menu  { display: none; }

        /* Mobile nav — < 640 px */
        @media (max-width: 639px) {
          .admin-desktop-nav { display: none !important; }
          .admin-desktop-logout { display: none !important; }
          .admin-hamburger   { display: flex !important; }
          .admin-mobile-menu { display: block !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Main bar */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 1rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}>

          {/* Logo */}
          <Link
            to="/admin/leads"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <img
              src="/mudancer-logo.png?v=3"
              alt="Mudancer"
              style={{
                height: "clamp(48px, 9vw, 66px)",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>

          {/* Desktop center nav */}
          <nav className="admin-desktop-nav" style={{ alignItems: "center", gap: "0.25rem", flex: 1, justifyContent: "center" }}>
            <LeadsDropdown location={location} />
            <Link
              to="/admin/providers"
              style={{
                padding: "0.5rem 1rem", borderRadius: 8,
                background: suppliersActive ? "rgba(34,197,94,0.12)" : "transparent",
                color: suppliersActive ? "#16a34a" : "#374151",
                fontWeight: 600, fontSize: "0.9rem",
                textDecoration: "none", letterSpacing: "0.04em",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (!suppliersActive) e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={e => { e.currentTarget.style.background = suppliersActive ? "rgba(34,197,94,0.12)" : "transparent"; }}
            >
              SUPPLIERS
            </Link>
          </nav>

          {/* Desktop logout */}
          <button
            type="button"
            className="admin-desktop-logout"
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.45rem 0.875rem", borderRadius: 8,
              border: "1.5px solid #e5e7eb", background: "#fff",
              color: "#6b7280", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
              transition: "border-color 0.15s, color 0.15s, background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "#fff"; }}
          >
            <span>⎋</span> Logout
          </button>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="admin-hamburger"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{
              display: "none", /* overridden by media query */
              alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 8,
              border: "1.5px solid #e5e7eb", background: mobileOpen ? "#f1f5f9" : "#fff",
              cursor: "pointer", flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: "1.25rem", lineHeight: 1, color: "#374151" }}>
              {mobileOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className="admin-mobile-menu"
          style={{
            display: "none", /* overridden by media query */
            animation: mobileOpen ? "mobileMenuSlide 0.2s ease" : "none",
          }}
        >
          {mobileOpen && (
            <div style={{
              borderTop: "1px solid #e5e7eb",
              background: "#fff",
              padding: "0.75rem 1rem 1rem",
            }}>
              {/* LEADS group */}
              <p style={{
                margin: "0 0 0.375rem 0.25rem",
                fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Leads
              </p>
              {LEADS_ITEMS.map(({ label, to }) => {
                const active =
                  location.pathname === to ||
                  (to !== "/admin/leads" && location.pathname.startsWith(to));
                return (
                  <Link key={to} to={to} style={navLinkStyle(active)}>
                    {label}
                  </Link>
                );
              })}

              <div style={{ height: 1, background: "#f1f5f9", margin: "0.625rem 0" }} />

              {/* Suppliers */}
              <Link to="/admin/providers" style={navLinkStyle(suppliersActive)}>
                Suppliers
              </Link>

              <div style={{ height: 1, background: "#f1f5f9", margin: "0.625rem 0" }} />

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "0.75rem 1.125rem",
                  borderRadius: 8, border: "1.5px solid #fca5a5",
                  background: "#fef2f2", color: "#dc2626",
                  fontWeight: 600, fontSize: "0.9375rem",
                  cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", transition: "background 0.15s",
                }}
              >
                ⎋ Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
