import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads, getAdjudicatedLeads } from "../../api/proveedorApi";

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(val) {
  if (!val && val !== 0) return "—";
  return "$" + Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function originDestino(lead) {
  const o = [lead.localidad_origen, lead.estado_origen].filter(Boolean).join(", ") || "—";
  const d = [lead.localidad_destino, lead.estado_destino].filter(Boolean).join(", ") || "—";
  return { o, d };
}

// ── Lead row for available leads table ────────────────────────────────────────
function AvailableRow({ lead, onClick }) {
  const { o, d } = originDestino(lead);
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">{lead.lead_id}</td>
      <td className="px-4 py-3 text-gray-800">{lead.nombre_cliente}</td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        <span className="text-green-700 font-medium">{o}</span>
        <span className="mx-1 text-gray-400">→</span>
        <span className="text-red-700 font-medium">{d}</span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{formatDate(lead.fecha_recoleccion)}</td>
      <td className="px-4 py-3">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Disponible
        </span>
      </td>
    </tr>
  );
}

// ── Lead row for adjudicated leads table ──────────────────────────────────────
function AdjudicatedRow({ lead, onClick }) {
  const { o, d } = originDestino(lead);
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">{lead.lead_id}</td>
      <td className="px-4 py-3 text-gray-800">{lead.nombre_cliente}</td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        <span className="text-green-700 font-medium">{o}</span>
        <span className="mx-1 text-gray-400">→</span>
        <span className="text-red-700 font-medium">{d}</span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{formatDate(lead.fecha_recoleccion)}</td>
      <td className="px-4 py-3 text-sm font-bold text-green-700 whitespace-nowrap">{fmtMoney(lead.precio_total)}</td>
      <td className="px-4 py-3">
        {lead.concluida ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
            Concluida
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Adjudicada ✓
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, color = "gray" }) {
  const colors = {
    green: "bg-green-600",
    blue:  "bg-blue-600",
    gray:  "bg-gray-600",
  };
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${colors[color]}`}>
        {count}
      </span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [available, setAvailable]       = useState([]);
  const [adjudicated, setAdjudicated]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getLeads(), getAdjudicatedLeads()])
      .then(([avail, adjud]) => {
        if (!cancelled) {
          setAvailable(avail);
          setAdjudicated(adjud);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function filterLeads(list) {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) =>
      [l.lead_id, l.nombre_cliente, l.estado_origen, l.estado_destino,
       l.localidad_origen, l.localidad_destino]
        .some((v) => v && v.toLowerCase().includes(q))
    );
  }

  const filteredAvail = filterLeads(available);
  const filteredAdjud = filterLeads(adjudicated);

  if (loading) return (
    <div className="p-4 flex justify-center items-center min-h-[40vh]">
      <p className="text-gray-500">Cargando leads…</p>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">LEADS</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Buscar por ID, cliente, origen, destino…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* ── Available leads ── */}
      <div className="mb-8">
        <SectionHeader title="Disponibles" count={filteredAvail.length} color="green" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Origen → Destino</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvail.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {search.trim() ? "Sin resultados." : "No hay leads disponibles en este momento."}
                    </td>
                  </tr>
                ) : (
                  filteredAvail.map((lead) => (
                    <AvailableRow
                      key={lead.id}
                      lead={lead}
                      onClick={() => navigate("/proveedor/leads/" + lead.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Adjudicated leads ── */}
      <div>
        <SectionHeader title="Adjudicadas" count={filteredAdjud.length} color="blue" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-blue-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Origen → Destino</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Tu precio</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjud.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {search.trim() ? "Sin resultados." : "Aún no tienes leads adjudicadas."}
                    </td>
                  </tr>
                ) : (
                  filteredAdjud.map((lead) => (
                    <AdjudicatedRow
                      key={lead.id}
                      lead={lead}
                      onClick={() => navigate("/proveedor/leads/" + lead.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
