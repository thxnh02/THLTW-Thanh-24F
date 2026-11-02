<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerAddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'province' => $this->province,
            'province_code' => $this->province_code,
            'ward' => $this->ward,
            'ward_code' => $this->ward_code,
            'district' => $this->district,
            'street' => $this->street,
            'detail' => $this->detail,
            'delivery_note' => $this->delivery_note,
            'is_default' => $this->is_default,
            'full_address' => implode(', ', array_filter([
                $this->street, $this->detail, $this->ward, $this->district, $this->province,
            ], fn ($part) => filled($part))),
        ];
    }
}
