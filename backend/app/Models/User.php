<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password', 'blocked_at'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['blocked_at' => 'datetime', 'password' => 'hashed'];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
