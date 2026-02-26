<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Provider;
use App\Models\ProviderLeadView;
use App\Models\Quote;
use App\Services\QuotePricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    /**
     * GET /api/proveedor/perfil — authenticated provider's own profile.
     */
    public function perfil(): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Perfil no encontrado.'], 404);
        }

        return response()->json(['data' => [
            'nombre'        => $provider->nombre,
            'email'         => $provider->email,
            'telefono'      => $provider->telefono,
            'rfc'           => $provider->rfc,
            'direccion'     => $provider->direccion,
            'responsable'   => $provider->responsable,
            'reputacion'    => $provider->reputacion,
            'logo'          => $provider->logo,
        ]]);
    }

    /**
     * GET /api/proveedor/leads — ALL published leads except those assigned to THIS provider.
     * Each lead includes a supplier_state (nueva/disponible/cotizada/adjudicada) and can_quote flag.
     *
     * State logic (calculated dynamically):
     *   adjudicada + this provider won  → excluded (lives in Orders)
     *   adjudicada + another won        → "adjudicada" (locked)
     *   this provider has a quote       → "cotizada"  (locked)
     *   this provider viewed but no quote → "disponible"
     *   never viewed                    → "nueva"
     */
    public function availableLeads(): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        // Lead IDs where THIS provider's quote was selected (these go to Orders, not Leads)
        $myWonLeadIds = Quote::where('provider_id', $provider->id)
            ->where('seleccionada', true)
            ->pluck('lead_id')
            ->toArray();

        // All published leads not won by this provider
        $leads = Lead::query()
            ->where('publicada', true)
            ->whereNotIn('id', $myWonLeadIds)
            ->orderBy('created_at', 'desc')
            ->select([
                'id', 'lead_id', 'nombre_cliente',
                'estado_origen', 'localidad_origen',
                'estado_destino', 'localidad_destino',
                'fecha_recoleccion', 'adjudicada',
            ])
            ->get();

        // Batch-load this provider's quoted lead IDs and viewed lead IDs
        $quotedLeadIds = Quote::where('provider_id', $provider->id)
            ->pluck('lead_id')
            ->flip()
            ->toArray();

        $viewedLeadIds = ProviderLeadView::where('provider_id', $provider->id)
            ->pluck('lead_id')
            ->flip()
            ->toArray();

        $result = $leads->map(function (Lead $lead) use ($quotedLeadIds, $viewedLeadIds) {
            $state = $this->computeSupplierState($lead, $quotedLeadIds, $viewedLeadIds);
            return [
                'id'               => $lead->id,
                'lead_id'          => $lead->lead_id,
                'nombre_cliente'   => $lead->nombre_cliente,
                'estado_origen'    => $lead->estado_origen,
                'localidad_origen' => $lead->localidad_origen,
                'estado_destino'   => $lead->estado_destino,
                'localidad_destino'=> $lead->localidad_destino,
                'fecha_recoleccion'=> $lead->fecha_recoleccion,
                'supplier_state'   => $state,
                'can_quote'        => in_array($state, ['nueva', 'disponible'], true),
            ];
        })->values();

        return response()->json(['data' => $result]);
    }

    /**
     * Compute the per-supplier state for a given lead.
     *
     * @param array $quotedLeadIds  flip()'d collection → array keyed by lead_id for fast lookup
     * @param array $viewedLeadIds  same
     */
    private function computeSupplierState(Lead $lead, array $quotedLeadIds, array $viewedLeadIds): string
    {
        if (isset($quotedLeadIds[$lead->id])) {
            // If the lead was also adjudicada (and someone else won), show adjudicada
            return $lead->adjudicada ? 'adjudicada' : 'cotizada';
        }
        if ($lead->adjudicada) {
            return 'adjudicada';
        }
        if (isset($viewedLeadIds[$lead->id])) {
            return 'disponible';
        }
        return 'nueva';
    }

    /**
     * GET /api/proveedor/leads/adjudicadas
     * Leads where adjudicada=true AND this provider's quote was selected.
     */
    public function adjudicatedLeads(): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        $leads = Lead::query()
            ->where('adjudicada', true)
            ->whereHas('quotes', function ($q) use ($provider) {
                $q->where('provider_id', $provider->id)
                  ->where('seleccionada', true);
            })
            ->with(['quotes' => function ($q) use ($provider) {
                $q->where('provider_id', $provider->id)
                  ->where('seleccionada', true)
                  ->select(['id', 'lead_id', 'precio_total', 'seleccionada']);
            }])
            ->orderBy('created_at', 'desc')
            ->select([
                'id', 'lead_id', 'nombre_cliente',
                'estado_origen', 'localidad_origen',
                'estado_destino', 'localidad_destino',
                'fecha_recoleccion', 'concluida',
            ])
            ->get()
            ->map(function (Lead $lead) {
                $quote = $lead->quotes->first();
                return [
                    'id'               => $lead->id,
                    'lead_id'          => $lead->lead_id,
                    'nombre_cliente'   => $lead->nombre_cliente,
                    'estado_origen'    => $lead->estado_origen,
                    'localidad_origen' => $lead->localidad_origen,
                    'estado_destino'   => $lead->estado_destino,
                    'localidad_destino'=> $lead->localidad_destino,
                    'fecha_recoleccion'=> $lead->fecha_recoleccion,
                    'concluida'        => $lead->concluida,
                    'precio_total'     => $quote?->precio_total,
                    'quote_id'         => $quote?->id,
                ];
            });

        return response()->json(['data' => $leads]);
    }

    /**
     * GET /api/proveedor/leads/{lead} — full lead detail.
     * Also records a view (nueva → disponible transition).
     * Returns supplier_state and can_quote alongside lead data.
     */
    public function showLead(Lead $lead): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        // Record view — idempotent, triggers nueva→disponible on next dashboard load
        ProviderLeadView::updateOrCreate(
            ['provider_id' => $provider->id, 'lead_id' => $lead->id]
        );

        $lead->loadCount(['quotes as my_quotes_count' => function ($q) use ($provider) {
            $q->where('provider_id', $provider->id);
        }]);

        // Compute supplier state (view was just recorded, so at least "disponible")
        $hasQuote = $lead->my_quotes_count > 0;
        $state = match (true) {
            $hasQuote && $lead->adjudicada => 'adjudicada',
            $hasQuote                      => 'cotizada',
            $lead->adjudicada              => 'adjudicada',
            default                        => 'disponible',
        };

        return response()->json([
            'data' => array_merge($lead->toArray(), [
                'supplier_state' => $state,
                'can_quote'      => in_array($state, ['nueva', 'disponible'], true),
            ]),
        ]);
    }

    /**
     * POST /api/proveedor/leads/{lead}/cotizar — submit quote.
     * Default split: apartado=20%, anticipo=40%, pago_final=40%.
     * Commission is calculated from the supplier's price using a fixed table.
     */
    public function submitQuote(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'precio_proveedor' => 'required|numeric|min:0',
            'notas'            => 'nullable|string',
            'nombre_propuesta' => 'nullable|string|max:120',
        ]);

        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        $precioProveedor = (float) $validated['precio_proveedor'];
        $insuredValue    = $lead->seguro > 0 ? (float) $lead->seguro : null;

        $calc = QuotePricingService::calculateQuote($precioProveedor, $insuredValue);
        $tarifaSeguro = $calc['tarifa_seguro'];

        $quote = Quote::create([
            'lead_id'          => $lead->id,
            'provider_id'      => $provider->id,
            'precio_proveedor' => round($precioProveedor, 2),
            'comision'         => $calc['comision'],
            'precio_total'     => $calc['precio_total'],
            'apartado'         => $calc['apartado'],
            'anticipo'         => $calc['anticipo'],
            'pago_final'       => $calc['pago_final'],
            'tarifa_seguro'    => $tarifaSeguro,
            'notas'            => $validated['notas'] ?? null,
            'nombre_propuesta' => $validated['nombre_propuesta'] ?? null,
        ]);

        return response()->json(['data' => $quote], 201);
    }

    /**
     * GET /api/proveedor/ordenes — quotes where lead.adjudicada=true and provider_id=current provider.
     */
    public function myOrders(): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        $quotes = Quote::query()
            ->where('provider_id', $provider->id)
            ->whereHas('lead', fn ($q) => $q->where('adjudicada', true))
            ->with('lead')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $quotes]);
    }

    /**
     * GET /api/proveedor/ordenes/{quote}/inventario — get pickup inventory for this quote's lead.
     */
    public function getInventario(Quote $quote): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider || (int) $quote->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $lead = $quote->lead;
        if (! $lead) {
            return response()->json(['message' => 'Lead not found.'], 404);
        }

        return response()->json([
            'data' => [
                'inventario_declarado'    => $lead->inventario,
                'inventario_recoleccion'  => $lead->inventario_recoleccion ?? [],
            ],
        ]);
    }

    /**
     * PUT /api/proveedor/ordenes/{quote}/inventario — save pickup inventory.
     * Body: { items: [{numero, articulo, condicion, notas}] }
     */
    public function saveInventario(Request $request, Quote $quote): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider || (int) $quote->provider_id !== $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'items'                => 'required|array',
            'items.*.numero'       => 'required|integer|min:1',
            'items.*.articulo'     => 'required|string|max:255',
            'items.*.condicion'    => 'nullable|string|max:50',
            'items.*.notas'        => 'nullable|string|max:500',
        ]);

        $lead = $quote->lead;
        if (! $lead) {
            return response()->json(['message' => 'Lead not found.'], 404);
        }

        $lead->inventario_recoleccion = $validated['items'];
        $lead->save();

        return response()->json(['message' => 'Inventario guardado.', 'data' => $lead->inventario_recoleccion]);
    }

    /**
     * POST /api/proveedor/ordenes/{quote}/concluir — log, notify admin via WA link, return success.
     */
    public function conclude(Quote $quote): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }
        if ((int) $quote->provider_id !== (int) $provider->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $lead = $quote->lead;

        \Log::info('Provider concluded service', [
            'quote_id'    => $quote->id,
            'lead_id'     => $lead?->lead_id ?? $quote->lead_id,
            'provider_id' => $provider->id,
        ]);

        // WhatsApp notification to admin
        $adminWaNumber = preg_replace('/[^0-9]/', '', (string) env('ADMIN_WHATSAPP_NUMBER', ''));
        if ($adminWaNumber !== '') {
            $provNombre = $provider->nombre ?? 'Proveedor';
            $leadId     = $lead?->lead_id ?? "#{$quote->lead_id}";
            $cliente    = $lead?->nombre_cliente ?? 'el cliente';
            $msgText    = implode("\n", [
                "✅ *Servicio concluido*",
                "Proveedor: {$provNombre}",
                "Lead ID: {$leadId} | Cliente: {$cliente}",
                "El proveedor indica que el servicio ha finalizado. Por favor confirma y cierra el expediente.",
            ]);
            $waUrl = 'https://wa.me/' . $adminWaNumber . '?text=' . rawurlencode($msgText);
            \Log::info("📱 Admin WA conclusion notification ready — click link to open WhatsApp", ['wa_url' => $waUrl]);
        }

        return response()->json(['message' => 'Success']);
    }

    /**
     * GET /api/leads/link/{leadId}/{token} — public: resolve a lead's internal id from its public URL.
     */
    public function resolveLink(string $leadId, string $token): JsonResponse
    {
        $lead = Lead::where('lead_id', $leadId)
            ->where('public_token', $token)
            ->where('publicada', true)
            ->first(['id', 'lead_id', 'nombre_cliente', 'estado_origen', 'estado_destino']);

        if (! $lead) {
            return response()->json(['message' => 'Enlace no válido o expirado.'], 404);
        }

        return response()->json(['id' => $lead->id, 'lead_id' => $lead->lead_id]);
    }

    /**
     * Get Provider record for the authenticated user (match by email).
     */
    private function getProviderForUser(): ?Provider
    {
        $user = auth()->user();
        if (! $user) {
            return null;
        }

        return Provider::where('email', $user->email)->first();
    }
}
