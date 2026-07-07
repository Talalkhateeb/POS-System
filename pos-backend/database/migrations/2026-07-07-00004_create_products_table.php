<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable(); // FR-3.5, kept as a plain string (no separate categories table)
            $table->decimal('price', 10, 2); // decimal, never float/double, for exact money math
            $table->integer('stock')->default(0);
            $table->integer('min_stock_threshold')->default(5); // FR-3.4 low-stock alert
            $table->boolean('is_active')->default(true); // FR-3.3: soft delete via flag, never a real DELETE
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};