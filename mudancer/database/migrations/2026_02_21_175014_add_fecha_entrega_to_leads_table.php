<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Estimated delivery / arrival date at destination [FechaEntrega]
            $table->date('fecha_entrega')->nullable()->after('fecha_recoleccion');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('fecha_entrega');
        });
    }
};
