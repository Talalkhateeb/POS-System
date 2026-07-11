// database/migrations/2026_07_09_000001_add_return_permission_to_users_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // UC-06: يحدد المدير هل يمكن للكاشير تنفيذ إرجاع دون موافقة (FR-1.3 / UC-03b)
            $table->boolean('can_return_without_approval')->default(false)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_return_without_approval');
        });
    }
};