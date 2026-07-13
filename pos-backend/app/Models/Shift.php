<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'cashier_id', 'opening_balance', 'closing_balance', 'status', 'opened_at', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'closing_balance' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function cashMovements()
    {
        return $this->hasMany(CashMovement::class);
    }

    public function getExpectedBalanceAttribute(): float
    {
        $movements = $this->relationLoaded('cashMovements')
            ? $this->cashMovements
            : $this->cashMovements()->get();

        $movementTotal = $movements->sum(fn (CashMovement $movement) => $movement->signed_amount);

        return round((float) $this->opening_balance + $movementTotal, 2);
    }
}
