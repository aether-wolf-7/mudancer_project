<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    /**
     * Handle an incoming request and ensure response is JSON.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Don't override Content-Type for non-JSON responses (PDFs, files, redirects, etc.)
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            return $response;
        }

        $existing = $response->headers->get('Content-Type', '');

        // Only force JSON if there's no content type or it's already text/html (default)
        if (empty($existing) || str_starts_with($existing, 'text/html')) {
            $response->headers->set('Content-Type', 'application/json');
        }

        return $response;
    }
}
