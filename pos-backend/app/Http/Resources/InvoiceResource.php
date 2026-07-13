<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'cashier_name' => $this->whenLoaded('cashier', fn () => $this->cashier->name),
            'subtotal' => (float) $this->subtotal,
            'tax_rate_applied' => (float) $this->tax_rate_applied,
            'tax_amount' => (float) $this->tax_amount,
            'total' => (float) $this->total,
            'payment_method' => $this->payment_method,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}