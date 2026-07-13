<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_admin_can_access_dashboard_summary(): void
    {
        $adminUser = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->actingAs($adminUser)->getJson('/api/dashboard/summary');

        $response->assertOk()
            ->assertJsonStructure([
                'period',
                'has_data',
                'range' => ['start', 'end'],
                'previous_range' => ['start', 'end'],
                'sales' => ['total', 'invoice_count'],
                'returns' => ['total'],
                'net_revenue',
                'comparison' => [
                    'previous_sales_total',
                    'previous_net_revenue',
                    'sales_total_change_percent',
                    'net_revenue_change_percent',
                ],
            ]);
    }

    public function test_guest_users_are_blocked_from_dashboard_summary(): void
    {
        $this->getJson('/api/dashboard/summary')->assertStatus(401);
    }
}
