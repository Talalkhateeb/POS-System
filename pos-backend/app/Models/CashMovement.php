<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    protected $fillable = [
        'shift_id', 'cashier_id', 'type', 'amount', 'movementable_id', 'movementable_type',
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

    public function movementable()
    {
        return $this->morphTo();
    }
}