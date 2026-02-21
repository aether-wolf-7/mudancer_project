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

const DEFAULT_SPLIT = { apartado: 20, anticipo: 40, pago_final: 40 };

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [precioTotal, setPrecioTotal] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Price split override state (percentages)
  const [splitOpen, setSplitOpen] = useState(false);
  const [pctApartado, setPctApartado] = useState(DEFAULT_SPLIT.apartado);
  const [pctAnticipo, setPctAnticipo] = useState(DEFAULT_SPLIT.anticipo);
  const [pctPagoFinal, setPctPagoFinal] = useState(DEFAULT_SPLIT.pago_final);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLead(id)
      .then((data) => {
        if (!cancelled) setLead(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  // Live-computed split amounts from percentages
  const splitAmounts = useMemo(() => {
    const precio = parseFloat(precioTotal);
    if (isNaN(precio) || precio <= 0) return null;
    return {
      apartado:   Math.round(precio * pctApartado  / 100 * 100) / 100,
      anticipo:   Math.round(precio * pctAnticipo  / 100 * 100) / 100,
      pago_final: Math.round(precio * pctPagoFinal / 100 * 100) / 100,
    };
  }, [precioTotal, pctApartado, pctAnticipo, pctPagoFinal]);

  const splitTotal = pctApartado + pctAnticipo + pctPagoFinal;
  const splitValid = splitTotal === 100;

  function handlePctChange(setter, otherA, otherASetter, otherB, otherBSetter, val) {
    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
    setter(n);
    // Auto-balance the last field
    const remaining = 100 - n - otherA;
    if (remaining >= 0) {
      otherBSetter(remaining);
    }
  }

  async function handleCotizar(e) {
    e.preventDefault();
    const precio = parseFloat(precioTotal);
    if (isNaN(precio) || precio < 0) {
      setError("Precio total debe ser un número válido.");
      return;
    }
    if (splitOpen && !splitValid) {
      setError("Los porcentajes de pago deben sumar exactamente 100%.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = { precio_total: precio, notas: notas.trim() || null };
      if (splitOpen && splitAmounts) {
        body.apartado   = splitAmounts.apartado;
        body.anticipo   = splitAmounts.anticipo;
        body.pago_final = splitAmounts.pago_final;
      }
      await submitQuote(id, body);
      setPrecioTotal("");
      setNotas("");
      setSplitOpen(false);
      setPctApartado(DEFAULT_SPLIT.apartado);
      setPctAnticipo(DEFAULT_SPLIT.anticipo);
      setPctPagoFinal(DEFAULT_SPLIT.pago_final);
      setLead((prev) => prev ? { ...prev, my_quotes_count: (prev.my_quotes_count ?? 0) + 1 } : null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al enviar cotización");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[40vh]">
        <p className="text-gray-500">Cargando…</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</div>
        <Link to="/proveedor/dashboard" className="text-primary font-medium">← Volver a LEADS</Link>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Link to="/proveedor/dashboard" className="inline-block text-primary font-medium mb-4">← Volver a LEADS</Link>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Lead {lead.lead_id}</h1>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cliente</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Nombre</dt><dd className="font-medium">{lead.nombre_cliente}</dd>
            <dt className="text-gray-500">Email</dt><dd>{lead.email_cliente}</dd>
            <dt className="text-gray-500">Teléfono</dt><dd>{lead.telefono_cliente}</dd>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Origen</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Estado</dt><dd>{lead.estado_origen || "—"}</dd>
            <dt className="text-gray-500">Localidad</dt><dd>{lead.localidad_origen || "—"}</dd>
            <dt className="text-gray-500">Colonia / Fracc.</dt><dd>{lead.colonia_origen || "—"}</dd>
            <dt className="text-gray-500">Piso / Nivel</dt><dd>{lead.piso_origen || "—"}</dd>
            <dt className="text-gray-500">Elevador</dt><dd>{lead.elevador_origen ? "Sí" : "No"}</dd>
            <dt className="text-gray-500">Acarreo</dt><dd>{lead.acarreo_origen || "Hasta 30 mts."}</dd>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Destino</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Estado</dt><dd>{lead.estado_destino || "—"}</dd>
            <dt className="text-gray-500">Localidad</dt><dd>{lead.localidad_destino || "—"}</dd>
            <dt className="text-gray-500">Colonia / Fracc.</dt><dd>{lead.colonia_destino || "—"}</dd>
            <dt className="text-gray-500">Piso / Nivel</dt><dd>{lead.piso_destino || "—"}</dd>
            <dt className="text-gray-500">Elevador</dt><dd>{lead.elevador_destino ? "Sí" : "No"}</dd>
            <dt className="text-gray-500">Acarreo</dt><dd>{lead.acarreo_destino || "Hasta 30 mts."}</dd>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Servicio</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Fecha de recolección</dt><dd>{formatDate(lead.fecha_recoleccion)}</dd>
            <dt className="text-gray-500">Fecha de llegada a destino</dt><dd>{lead.fecha_entrega ? formatDate(lead.fecha_entrega) : lead.tiempo_estimado || "Acordar"}</dd>
            <dt className="text-gray-500">Modalidad</dt><dd>{lead.modalidad || "—"}</dd>
            <dt className="text-gray-500">Empaque</dt><dd>{lead.empaque || "—"}</dd>
            {lead.seguro ? (
              <>
                <dt className="text-gray-500">Valor declarado (seguro)</dt>
                <dd className="font-semibold text-blue-700">${Number(lead.seguro).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</dd>
              </>
            ) : null}
            {lead.inventario && (
              <>
                <dt className="text-gray-500">Inventario</dt>
                <dd className="sm:col-span-2 whitespace-pre-line">{lead.inventario}</dd>
              </>
            )}
            {lead.articulos_delicados && (
              <>
                <dt className="text-gray-500">Artículos delicados / especiales</dt>
                <dd className="sm:col-span-2">{lead.articulos_delicados}</dd>
              </>
            )}
            {lead.observaciones && (
              <>
                <dt className="text-gray-500">Observaciones</dt>
                <dd className="sm:col-span-2">{lead.observaciones}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Already quoted badge */}
        {lead.my_quotes_count > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
            ✓ Ya enviaste {lead.my_quotes_count} cotización{lead.my_quotes_count > 1 ? "es" : ""} para este lead.
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizar</h2>
          <form onSubmit={handleCotizar} className="space-y-4">

            {/* Price total */}
            <div>
              <label htmlFor="precio_total" className="block text-sm font-medium text-gray-700 mb-1">Precio Total *</label>
              <input
                id="precio_total"
                type="number"
                step="0.01"
                min="0"
                value={precioTotal}
                onChange={(e) => setPrecioTotal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0.00"
                required
              />
            </div>

            {/* Insurance pre-calculation */}
            {lead.seguro > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-semibold text-blue-800 mb-1">💼 Seguro de mudanza</p>
                <p className="text-blue-700">
                  Valor declarado por el cliente:{" "}
                  <span className="font-bold">{fmtMXN(lead.seguro)}</span>
                </p>
                <p className="text-blue-700 mt-0.5">
                  Tarifa de seguro estimada:{" "}
                  <span className="font-bold text-blue-900">{fmtMXN(lead.seguro * 0.015)}</span>
                  <span className="text-blue-500 ml-1">(1.5% del valor declarado)</span>
                </p>
                <p className="text-blue-500 text-xs mt-1">
                  Considera incluir esta tarifa en tu precio total.
                </p>
              </div>
            )}

            {/* Live split preview (default) */}
            {splitAmounts && !splitOpen && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
                <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Desglose de pagos (20 / 40 / 40 %)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[["Apartado", splitAmounts.apartado], ["Anticipo", splitAmounts.anticipo], ["Al llegar", splitAmounts.pago_final]].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-gray-400 text-xs">{label}</p>
                      <p className="font-bold text-gray-800">{fmtMXN(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price split override toggle */}
            <button
              type="button"
              onClick={() => setSplitOpen((o) => !o)}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              {splitOpen ? "▲ Ocultar ajuste de pagos" : "▼ Ajustar distribución de pagos"}
            </button>

            {/* Price split override panel */}
            {splitOpen && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">
                  Ajusta los porcentajes. Deben sumar <strong>100%</strong>.
                  {!splitValid && (
                    <span className="text-red-500 ml-2">Actualmente: {splitTotal}%</span>
                  )}
                  {splitValid && (
                    <span className="text-green-600 ml-2">✓ 100%</span>
                  )}
                </p>

                {[
                  ["Apartado (reserva)", pctApartado, (val) => {
                    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
                    setPctApartado(n);
                    const rem = Math.max(0, 100 - n - pctAnticipo);
                    setPctPagoFinal(rem);
                  }],
                  ["Anticipo (día de recolección)", pctAnticipo, (val) => {
                    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
                    setPctAnticipo(n);
                    const rem = Math.max(0, 100 - pctApartado - n);
                    setPctPagoFinal(rem);
                  }],
                  ["Pago a la llegada", pctPagoFinal, (val) => {
                    const n = Math.max(0, Math.min(100, parseInt(val) || 0));
                    setPctPagoFinal(n);
                    const rem = Math.max(0, 100 - pctApartado - n);
                    setPctAnticipo(rem);
                  }],
                ].map(([label, pct, onChange]) => {
                  const precio = parseFloat(precioTotal) || 0;
                  const amount = Math.round(precio * pct / 100 * 100) / 100;
                  return (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-gray-700">{label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-16 text-center border border-gray-300 rounded-md text-sm px-2 py-1 focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-gray-500">%</span>
                          {precio > 0 && (
                            <span className="text-sm font-bold text-gray-800 w-24 text-right">{fmtMXN(amount)}</span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Comentarios opcionales para el cliente"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || (splitOpen && !splitValid)}
              className="w-full py-3 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Ofrece tu mejor precio…"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
