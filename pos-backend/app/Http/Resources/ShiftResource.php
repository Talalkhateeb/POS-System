<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cashier_id' => $this->cashier_id,
            'cashier_name' => $this->cashier->name ?? null,
            'opening_balance' => $this->opening_balance,
            'closing_balance' => $this->closing_balance,
            'status' => $this->status,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
        ];
    }
}