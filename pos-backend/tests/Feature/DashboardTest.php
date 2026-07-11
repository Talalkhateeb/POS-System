<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_admin_can_access_the_dashboard_successfully(): void
    {
        $adminUser = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($adminUser)->getJson('/api/dashboard');

        $response->assertOk();
    }

    /** @test */
    public function guest_users_are_blocked_from_dashboard(): void
    {
        $this->getJson('/api/dashboard')->assertStatus(401);
    }
}
