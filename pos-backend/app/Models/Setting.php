<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['tax_enabled', 'tax_rate', 'store_name', 'currency'];

    protected function casts(): array
    {
        return [
            'tax_enabled' => 'boolean',
            'tax_rate' => 'decimal:2',
        ];
    }

    public static function current(): self
    {
        return static::firstOrCreate([]); // guarantees exactly one row always exists
    }
}