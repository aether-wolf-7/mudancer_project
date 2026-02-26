<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->decimal('precio_proveedor', 12, 2)->nullable()->after('precio_total');
            $table->decimal('comision', 12, 2)->nullable()->after('precio_proveedor');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn(['precio_proveedor', 'comision']);
        });
    }
};
