<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminBrowserSession extends Model
{
    protected $fillable = ['user_id', 'token_hash', 'customer_auth_version', 'expires_at'];

    protected function casts(): array
    {
        return ['customer_auth_version' => 'integer', 'expires_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
