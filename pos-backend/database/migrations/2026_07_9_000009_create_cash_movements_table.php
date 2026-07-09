// database/migrations/2025_01_15_000003_create_cash_movements_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts');
            $table->foreignId('cashier_id')->constrained('users');
            $table->enum('type', ['sale', 'return']);
            $table->decimal('amount', 10, 2);
            $table->nullableMorphs('reference'); // reference_id + reference_type
            $table->timestamps();
        });

        Schema::table('cash_movements', function (Blueprint $table) {
            $table->check('amount >= 0', 'amount_must_be_positive');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
    }
};