<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleReturn extends Model
{
    protected $table = 'sale_returns';

    protected $fillable = [
        'invoice_id', 'cashier_id', 'shift_id', 'total_return_amount',
    ];

    protected function casts(): array
    {
        return [
            'total_return_amount' => 'decimal:2',
        ];
    }

    public function items()
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function cashMovements()
    {
        return $this->morphMany(CashMovement::class, 'reference');
    }
}
