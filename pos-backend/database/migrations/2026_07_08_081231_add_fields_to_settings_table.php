<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            if (!Schema::hasColumn('settings', 'tax_enabled')) {
                $table->boolean('tax_enabled')->default(false);
            }
            if (!Schema::hasColumn('settings', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->default(0);
            }
            if (!Schema::hasColumn('settings', 'store_name')) {
                $table->string('store_name')->default('My Store');
            }
            if (!Schema::hasColumn('settings', 'currency')) {
                $table->string('currency', 10)->default('USD');
            }
            if (!Schema::hasColumn('settings', 'invoice_header')) {
                $table->string('invoice_header')->nullable();
            }
            if (!Schema::hasColumn('settings', 'low_stock_threshold')) {
                $table->unsignedInteger('low_stock_threshold')->default(5);
            }
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'tax_enabled', 'tax_rate', 'store_name',
                'currency', 'invoice_header', 'low_stock_threshold',
            ]);
        });
    }
};