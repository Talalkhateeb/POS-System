<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tax_enabled' => $this->tax_enabled,
            'tax_rate' => $this->tax_rate,
            'store_name' => $this->store_name,
            'currency' => $this->currency,
            'invoice_header' => $this->invoice_header,
            'low_stock_threshold' => $this->low_stock_threshold,
        ];
    }
}