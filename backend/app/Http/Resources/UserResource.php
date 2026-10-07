<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => $this->avatar_url,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'role' => $this->role,
            'status' => $this->status,
            'orders_count' => $this->when(isset($this->orders_count), $this->orders_count),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
