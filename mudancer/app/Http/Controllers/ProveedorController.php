<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Provider;
use App\Models\Quote;
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
     * GET /api/proveedor/leads — available leads: publicada=true, adjudicada=false, newest first.
     */
    public function availableLeads(): JsonResponse
    {
        $leads = Lead::query()
            ->where('publicada', true)
            ->where('adjudicada', false)
            ->orderBy('created_at', 'desc')
            ->select([
                'id', 'lead_id', 'nombre_cliente',
                'estado_origen', 'localidad_origen',
                'estado_destino', 'localidad_destino',
                'fecha_recoleccion',
            ])
            ->withCount('quotes')
            ->get();

        return response()->json(['data' => $leads]);
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
     * GET /api/proveedor/leads/{lead} — full lead + current provider's quotes count for this lead.
     */
    public function showLead(Lead $lead): JsonResponse
    {
        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        $lead->loadCount(['quotes as my_quotes_count' => function ($q) use ($provider) {
            $q->where('provider_id', $provider->id);
        }]);

        return response()->json(['data' => $lead]);
    }

    /**
     * POST /api/proveedor/leads/{lead}/cotizar — submit quote.
     * Default split: apartado=20%, anticipo=40%, pago_final=40%.
     * Provider may override by sending explicit apartado/anticipo/pago_final amounts.
     */
    public function submitQuote(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'precio_total' => 'required|numeric|min:0',
            'notas'        => 'nullable|string',
            'apartado'     => 'nullable|numeric|min:0',
            'anticipo'     => 'nullable|numeric|min:0',
            'pago_final'   => 'nullable|numeric|min:0',
        ]);

        $provider = $this->getProviderForUser();
        if (! $provider) {
            return response()->json(['message' => 'Provider profile not found.'], 403);
        }

        $precio = (float) $validated['precio_total'];

        // Use explicit split if all three are provided; otherwise default percentages
        $hasExplicitSplit = isset($validated['apartado'], $validated['anticipo'], $validated['pago_final']);
        if ($hasExplicitSplit) {
            $apartado  = round((float) $validated['apartado'],   2);
            $anticipo  = round((float) $validated['anticipo'],   2);
            $pagoFinal = round((float) $validated['pago_final'], 2);
        } else {
            $apartado  = round($precio * 0.2, 2);
            $anticipo  = round($precio * 0.4, 2);
            $pagoFinal = round($precio * 0.4, 2);
        }

        // Insurance fee: 1.5% of the declared insured value on the lead (not of the quote price)
        $tarifaSeguro = ($lead->seguro > 0) ? round((float) $lead->seguro * 0.015, 2) : null;

        $quote = Quote::create([
            'lead_id'       => $lead->id,
            'provider_id'   => $provider->id,
            'precio_total'  => $precio,
            'apartado'      => $apartado,
            'anticipo'      => $anticipo,
            'pago_final'    => $pagoFinal,
            'tarifa_seguro' => $tarifaSeguro,
            'notas'         => $validated['notas'] ?? null,
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
