<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    protected $fillable = [
        'shift_id', 'cashier_id', 'type', 'amount', 'reference_id', 'reference_type',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function getSignedAmountAttribute(): float
    {
        $amount = (float) $this->amount;

        return $this->type === 'return' ? -$amount : $amount;
    }
}
