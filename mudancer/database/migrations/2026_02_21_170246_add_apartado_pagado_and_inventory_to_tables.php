<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Track whether the admin has received the client's apartado payment
        Schema::table('quotes', function (Blueprint $table) {
            $table->boolean('apartado_pagado')->default(false)->after('seleccionada');
        });

        // Digital pickup inventory filled by the provider at the origin location
        // Stored as JSON: [{numero, articulo, condicion, notas}]
        Schema::table('leads', function (Blueprint $table) {
            $table->json('inventario_recoleccion')->nullable()->after('inventario');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('apartado_pagado');
        });
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('inventario_recoleccion');
        });
    }
};
