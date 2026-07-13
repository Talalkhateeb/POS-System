<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Setting;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

       User::factory()->create([
             'name' => 'Admin',
             'username' => 'admin',
             'password' => bcrypt('admin1234'),
             'role' => 'admin',
             'is_active' => true,
            ]);
            Setting::firstOrCreate([], [
            'tax_enabled' => true,
            'tax_rate' => 10.00,
            'store_name' => 'POS Training Store',
            'currency' => 'JOD',

            ]);
    }
}
