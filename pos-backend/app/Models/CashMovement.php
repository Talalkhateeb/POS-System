<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CashMovement extends Model
{
    protected $fillable = [
        'shift_id', 'cashier_id', 'type', 'amount',
        'reference_id', 'reference_type',
    ];

    protected static function booted(): void
    {
        static::saving(function (CashMovement $movement) {
            $movement->amount = abs($movement->amount);
        });
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function getSignedAmountAttribute(): float
    {
        return $this->type === 'return' ? -(float) $this->amount : (float) $this->amount;
    }
}