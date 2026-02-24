<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tracks which providers have viewed which leads.
     * Used to distinguish Nueva (never viewed) vs Disponible (viewed, not quoted).
     */
    public function up(): void
    {
        Schema::create('provider_lead_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->timestamp('viewed_at')->useCurrent();
            $table->unique(['provider_id', 'lead_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_lead_views');
    }
};
