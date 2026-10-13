<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
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
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'province' => $this->province,
            'district' => $this->district,
            'ward' => $this->ward,
            'address_line' => $this->address_line,
            'is_default' => (bool) $this->is_default,
        ];
    }
}
