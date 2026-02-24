<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Tracks which provider has viewed which lead.
 * Existence of a row = provider opened the lead at least once.
 */
class ProviderLeadView extends Model
{
    public $timestamps = false;

    protected $table = 'provider_lead_views';

    protected $fillable = ['provider_id', 'lead_id', 'viewed_at'];
}
