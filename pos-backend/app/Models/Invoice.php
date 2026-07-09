<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'cashier_id', 'shift_id', 'subtotal',
    'tax_rate_applied', 'tax_amount', 'total', 'payment_method',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_rate_applied' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }
    public function cashMovements(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(CashMovement::class, 'reference');
    }

    public function saleReturns(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

}