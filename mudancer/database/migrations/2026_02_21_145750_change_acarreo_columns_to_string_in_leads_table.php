<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('acarreo_origen')->nullable()->default(null)->change();
            $table->string('acarreo_destino')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->integer('acarreo_origen')->unsigned()->default(30)->change();
            $table->integer('acarreo_destino')->unsigned()->default(30)->change();
        });
    }
};
