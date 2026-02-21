<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Lead;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PdfController extends Controller
{
    /**
     * Valid document types and their Blade view names.
     */
    private const TYPES = [
        'cotizacion'    => 'pdf.cotizacion',
        'ods-cliente'   => 'pdf.ods-cliente',
        'ods-proveedor' => 'pdf.ods-proveedor',
    ];

    /**
     * Admin: download any document type for any quote.
     * GET /api/admin/quotes/{quote}/pdf/{type}
     * Auth: sanctum
     */
    public function adminPdf(Request $request, Quote $quote, string $type): Response
    {
        $this->validateType($type);
        return $this->buildPdf($quote, $type);
    }

    /**
     * Provider: download their own quote documents.
     * GET /api/proveedor/quotes/{quote}/pdf/{type}
     * Auth: sanctum + provider.auth
     * Allowed types: cotizacion, ods-proveedor
     */
    public function providerPdf(Request $request, Quote $quote, string $type): Response
    {
        $this->validateType($type, ['cotizacion', 'ods-proveedor']);

        // Ensure this quote belongs to the authenticated provider
        $user     = auth()->user();
        $provider = \App\Models\Provider::where('email', $user->email)->first();

        if (! $provider || (int) $quote->provider_id !== $provider->id) {
            abort(403, 'Access denied.');
        }

        return $this->buildPdf($quote, $type);
    }

    /**
     * Client: download a quote PDF using the lead's public_token for authentication.
     * GET /api/cliente/quotes/{quote}/pdf?token={public_token}
     * Auth: public (token-gated)
     * Allowed types: cotizacion only
     */
    public function clientePdf(Request $request, Quote $quote): Response
    {
        $token = $request->query('token');
        $lead  = $quote->lead;

        if (! $token || ! $lead || $lead->public_token !== $token) {
            abort(403, 'Invalid or missing token.');
        }

        return $this->buildPdf($quote, 'cotizacion');
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function validateType(string $type, array $allowed = null): void
    {
        $valid = $allowed ?? array_keys(self::TYPES);
        if (! in_array($type, $valid, true)) {
            abort(404, 'Document type not found.');
        }
    }

    private function buildPdf(Quote $quote, string $type): Response
    {
        $quote->loadMissing(['lead', 'provider']);

        $lead     = $quote->lead;
        $provider = $quote->provider;

        if (! $lead || ! $provider) {
            abort(404, 'Quote data incomplete.');
        }

        $view = self::TYPES[$type];

        $pdf = Pdf::loadView($view, compact('lead', 'provider', 'quote'))
            ->setPaper('letter', 'portrait');

        $filename = implode('-', array_filter([
            strtoupper(str_replace('-', '_', $type)),
            $lead->lead_id,
            $provider->nombre ? \Str::slug($provider->nombre) : null,
        ])) . '.pdf';

        return $pdf->download($filename);
    }
}
