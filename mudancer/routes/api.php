<?php

use App\Http\Controllers\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Admin\ProviderController as AdminProviderController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\ProveedorController;
use Illuminate\Support\Facades\Route;

Route::post('webhook/wpforms', [LeadController::class, 'receiveFromWPForms']);

Route::prefix('cliente')->group(function () {
    Route::post('login', [ClienteController::class, 'login']);
    Route::put('quotes/{quote}/seleccionar', [ClienteController::class, 'seleccionar']);
    Route::get('quotes/{quote}/pdf', [PdfController::class, 'clientePdf']);
});

Route::prefix('admin')->group(function () {
    Route::post('login', [AuthController::class, 'adminLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('leads', [AdminLeadController::class, 'index']);
        Route::get('leads/{id}', [AdminLeadController::class, 'show']);
        Route::put('leads/{id}', [AdminLeadController::class, 'update']);
        Route::post('leads/{id}/publish', [AdminLeadController::class, 'publish']);
        Route::post('leads/{id}/adjudicar', [AdminLeadController::class, 'adjudicar']);
        Route::post('leads/{id}/concluir', [AdminLeadController::class, 'concluir']);
        Route::get('cotizadas', [AdminLeadController::class, 'quotedLeads']);
        Route::get('ordenes', [AdminLeadController::class, 'ordenes']);
        Route::post('quotes/{quote}/asignar', [AdminLeadController::class, 'assignQuote']);
        Route::post('quotes/{quote}/marcar-pago', [AdminLeadController::class, 'marcarPago']);
        Route::get('quotes/{quote}/pdf/{type}', [PdfController::class, 'adminPdf']);

        Route::apiResource('providers', AdminProviderController::class);
    });
});

Route::prefix('proveedor')->group(function () {
    Route::post('login', [AuthController::class, 'providerLogin']);

    Route::middleware(['auth:sanctum', 'provider.auth'])->group(function () {
        Route::get('leads', [ProveedorController::class, 'availableLeads']);
        Route::get('leads/{lead}', [ProveedorController::class, 'showLead']);
        Route::post('leads/{lead}/cotizar', [ProveedorController::class, 'submitQuote']);
        Route::get('ordenes', [ProveedorController::class, 'myOrders']);
        Route::post('ordenes/{quote}/concluir', [ProveedorController::class, 'conclude']);
        Route::get('ordenes/{quote}/inventario', [ProveedorController::class, 'getInventario']);
        Route::put('ordenes/{quote}/inventario', [ProveedorController::class, 'saveInventario']);
        Route::get('quotes/{quote}/pdf/{type}', [PdfController::class, 'providerPdf']);
    });
});
