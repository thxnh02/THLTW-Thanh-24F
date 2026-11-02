<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerEmailOtp extends Model
{
    public const VERIFY_EMAIL = 'verify_email';

    public const RESET_PASSWORD = 'reset_password';

    protected $fillable = [
        'user_id', 'email', 'purpose', 'otp_hash', 'expires_at',
        'consumed_at', 'failed_attempts', 'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'last_sent_at' => 'datetime',
            'failed_attempts' => 'integer',
        ];
    }
}
