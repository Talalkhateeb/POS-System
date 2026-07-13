<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'can_return_without_approval')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_return_without_approval')->default(false)->after('role');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'can_return_without_approval')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_return_without_approval');
        });
    }
};
