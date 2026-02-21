<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    /**
     * POST /api/cliente/login
     *
     * Returns one of three statuses:
     *  - not_found  (404) — no lead exists for this phone number
     *  - pending    (200) — lead exists but admin has not published it yet
     *  - published  (200) — lead is published; includes quotes with provider info
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'telefono' => 'required|string|size:10|regex:/^[0-9]+$/',
        ], [
            'telefono.required' => 'El número de teléfono es requerido.',
            'telefono.size'     => 'El número de teléfono debe tener exactamente 10 dígitos.',
            'telefono.regex'    => 'El número de teléfono solo debe contener números.',
        ]);

        $lead = Lead::where('telefono_cliente', $request->telefono)
            ->with(['quotes' => function ($q) {
                $q->with('provider')->orderBy('precio_total', 'asc');
            }])
            ->first();

        if (! $lead) {
            return response()->json([
                'status'  => 'not_found',
                'message' => 'No encontramos ninguna solicitud con ese número de teléfono.',
            ], 404);
        }

        // Lead exists but admin hasn't published it yet
        if (! $lead->publicada) {
            return response()->json([
                'status'  => 'pending',
                'message' => 'Tu solicitud fue recibida, pero aún no ha sido aprobada. Por favor espera, esto puede tardar hasta 8 horas.',
            ], 200);
        }

        // Lead is published — return quotes
        return response()->json([
            'status' => 'published',
            'lead'   => [
                'id'               => $lead->id,
                'lead_id'          => $lead->lead_id,
                'public_token'     => $lead->public_token,
                'nombre_cliente'   => $lead->nombre_cliente,
                'estado_origen'    => $lead->estado_origen,
                'localidad_origen' => $lead->localidad_origen,
                'estado_destino'   => $lead->estado_destino,
                'localidad_destino'=> $lead->localidad_destino,
                'fecha_recoleccion'=> $lead->fecha_recoleccion,
                'adjudicada'       => $lead->adjudicada,
                'concluida'        => $lead->concluida,
            ],
            'quotes' => $lead->quotes->map(fn (Quote $q) => [
                'id'                 => $q->id,
                'precio_total'       => $q->precio_total,
                'apartado'           => $q->apartado,
                'anticipo'           => $q->anticipo,
                'pago_final'         => $q->pago_final,
                'tarifa_seguro'      => $q->tarifa_seguro,
                'notas'              => $q->notas,
                'cliente_interesada' => $q->cliente_interesada,
                'seleccionada'       => $q->seleccionada,
                'provider' => $q->provider ? [
                    'id'          => $q->provider->id,
                    'nombre'      => $q->provider->nombre,
                    'logo'        => $q->provider->logo,
                    'reputacion'  => $q->provider->reputacion,
                    'telefono'    => $q->provider->telefono,
                    'responsable' => $q->provider->responsable,
                ] : null,
            ])->values(),
        ], 200);
    }

    /**
     * PUT /api/cliente/quotes/{quote}/seleccionar
     *
     * Marks the client's preferred quote with cliente_interesada = true.
     * Does NOT modify seleccionada or adjudicada — the admin handles assignment.
     */
    public function seleccionar(Quote $quote): JsonResponse
    {
        // Clear previous interest on other quotes for the same lead
        Quote::where('lead_id', $quote->lead_id)
            ->where('id', '!=', $quote->id)
            ->where('cliente_interesada', true)
            ->update(['cliente_interesada' => false]);

        $quote->update(['cliente_interesada' => true]);

        return response()->json([
            'status'  => 'interested',
            'message' => 'Tu preferencia fue registrada. Por favor comunícate con nosotros por WhatsApp para proceder con el apartado.',
        ]);
    }
}
