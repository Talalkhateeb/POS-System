<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'price_at_sale' => (float) $this->price_at_sale,
            'quantity' => $this->quantity,
            'line_total' => (float) $this->line_total,
        ];
    }
}