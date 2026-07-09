<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'invoice_number' => $this->invoice->invoice_number ?? null,
            'cashier_id' => $this->cashier_id,
            'cashier_name' => $this->cashier->name ?? null,
            'shift_id' => $this->shift_id,
            'total_return_amount' => $this->total_return_amount,
            'created_at' => $this->created_at,
            'items' => $this->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'product_name' => $i->product->name ?? null,
                'quantity' => $i->quantity,
                'unit_price_snapshot' => $i->unit_price_snapshot,
                'line_total' => $i->quantity * $i->unit_price_snapshot,
            ]),
        ];
    }
}