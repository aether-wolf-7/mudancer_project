<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Lead;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

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

    /**
     * Admin: create a short-lived (120 sec) one-time download URL for a PDF.
     * POST /api/admin/quotes/{quote}/pdf-token/{type}
     * Returns { url: "https://...api/pdf/tmp/{token}" }
     */
    public function adminPdfToken(Request $request, Quote $quote, string $type): JsonResponse
    {
        $this->validateType($type);
        return response()->json(['url' => $this->makeTempUrl($quote->id, $type)]);
    }

    /**
     * Provider: create a short-lived download URL for their own quote PDF.
     * POST /api/proveedor/quotes/{quote}/pdf-token/{type}
     */
    public function providerPdfToken(Request $request, Quote $quote, string $type): JsonResponse
    {
        $this->validateType($type, ['cotizacion', 'ods-proveedor']);

        $user     = auth()->user();
        $provider = \App\Models\Provider::where('email', $user->email)->first();
        if (! $provider || (int) $quote->provider_id !== $provider->id) {
            abort(403, 'Access denied.');
        }

        return response()->json(['url' => $this->makeTempUrl($quote->id, $type)]);
    }

    /**
     * Public: serve a PDF using a one-time temporary token (120 sec TTL).
     * GET /api/pdf/tmp/{token}
     */
    public function tempPdf(Request $request, string $token): Response
    {
        $payload = Cache::pull("pdf_tmp_{$token}");

        if (! $payload) {
            abort(404, 'Link expirado o inválido.');
        }

        $quote = Quote::findOrFail($payload['quote_id']);
        return $this->buildPdf($quote, $payload['type']);
    }

    /**
     * Generate (or return existing) share token for a quote.
     * POST /api/admin/quotes/{quote}/share-token
     * Returns shareable URLs for all three document types.
     */
    public function generateShareToken(Request $request, Quote $quote): JsonResponse
    {
        if (! $quote->share_token) {
            $quote->update(['share_token' => Str::random(32)]);
        }

        $base = rtrim(env('APP_URL', 'http://localhost'), '/');

        $urls = [];
        foreach (array_keys(self::TYPES) as $type) {
            $urls[$type] = "{$base}/api/pdf/share/{$quote->share_token}/{$type}";
        }

        return response()->json(['token' => $quote->share_token, 'urls' => $urls]);
    }

    /**
     * Provider: generate (or retrieve) share token for their own quote.
     * POST /api/proveedor/quotes/{quote}/share-token
     */
    public function providerShareToken(Request $request, Quote $quote): JsonResponse
    {
        $user     = auth()->user();
        $provider = \App\Models\Provider::where('email', $user->email)->first();

        if (! $provider || (int) $quote->provider_id !== $provider->id) {
            abort(403, 'Access denied.');
        }

        if (! $quote->share_token) {
            $quote->update(['share_token' => Str::random(32)]);
        }

        $base = rtrim(env('APP_URL', 'http://localhost'), '/');
        $urls = [];
        foreach (array_keys(self::TYPES) as $type) {
            $urls[$type] = "{$base}/api/pdf/share/{$quote->share_token}/{$type}";
        }

        return response()->json(['token' => $quote->share_token, 'urls' => $urls]);
    }

    /**
     * Public (no auth): serve a PDF by share token + type.
     * GET /api/pdf/share/{token}/{type}
     */
    public function publicPdf(Request $request, string $token, string $type): Response
    {
        $this->validateType($type);

        $quote = Quote::where('share_token', $token)->firstOrFail();

        return $this->buildPdf($quote, $type);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Store a one-time payload in cache (120 sec) and return the public URL.
     */
    private function makeTempUrl(int $quoteId, string $type): string
    {
        $token = Str::random(32);
        Cache::put("pdf_tmp_{$token}", ['quote_id' => $quoteId, 'type' => $type], 120);
        $base = rtrim(env('APP_URL', 'https://app.mudancer.com'), '/');
        // Strip trailing /api if APP_URL includes it
        $base = preg_replace('#/api$#', '', $base);
        return "{$base}/api/pdf/tmp/{$token}";
    }

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

        $content = $pdf->output();

        return response($content, 200, [
            'Content-Type'           => 'application/pdf',
            'Content-Disposition'    => 'inline; filename="' . $filename . '"',
            'Content-Length'         => strlen($content),
            'Cache-Control'          => 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
