<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'cashier_id', 'opening_balance', 'closing_balance',
        'status', 'opened_at', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'shift_id');
    }

    // Calculated expected balance: opening + all signed movements
    public function getExpectedBalanceAttribute(): float
    {
        return (float) $this->opening_balance + $this->cashMovements->sum('signed_amount');
    }
}