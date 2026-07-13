<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const PERIOD_ALIASES = [
        'week' => 'this_week',
        'month' => 'this_month',
    ];

    private const VALID_PERIODS = [
        'today',
        'yesterday',
        'this_week',
        'last_week',
        'this_month',
        'last_month',
        'custom',
    ];

    private function resolveRange(Request $request): array
    {
        $period = (string) $request->query('period', 'today');
        $period = self::PERIOD_ALIASES[$period] ?? $period;

        if (! in_array($period, self::VALID_PERIODS, true)) {
            $period = 'today';
        }

        $now = Carbon::now();

        [$start, $end] = match ($period) {
            'yesterday' => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
            'this_week' => [$now->copy()->startOfWeek()->startOfDay(), $now->copy()->endOfWeek()->endOfDay()],
            'last_week' => [$now->copy()->subWeek()->startOfWeek()->startOfDay(), $now->copy()->subWeek()->endOfWeek()->endOfDay()],
            'this_month' => [$now->copy()->startOfMonth()->startOfDay(), $now->copy()->endOfMonth()->endOfDay()],
            'last_month' => [$now->copy()->subMonthNoOverflow()->startOfMonth()->startOfDay(), $now->copy()->subMonthNoOverflow()->endOfMonth()->endOfDay()],
            'custom' => $this->customRange($request, $now),
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };

        $previousEnd = $start->copy()->subSecond();
        $previousStart = $previousEnd->copy()->subSeconds($start->diffInSeconds($end))->startOfSecond();

        return [$period, $start, $end, $previousStart, $previousEnd];
    }

    private function customRange(Request $request, Carbon $fallbackNow): array
    {
        try {
            $start = Carbon::parse((string) $request->query('from'))->startOfDay();
            $end = Carbon::parse((string) $request->query('to'))->endOfDay();

            if ($start->greaterThan($end)) {
                return [$fallbackNow->copy()->startOfDay(), $fallbackNow->copy()->endOfDay()];
            }

            return [$start, $end];
        } catch (\Throwable) {
            return [$fallbackNow->copy()->startOfDay(), $fallbackNow->copy()->endOfDay()];
        }
    }

    public function summary(Request $request)
    {
        [$period, $start, $end, $previousStart, $previousEnd] = $this->resolveRange($request);

        $sales = $this->salesTotals($start, $end);
        $previousSales = $this->salesTotals($previousStart, $previousEnd);
        $returns = $this->returnsTotals($start, $end);
        $previousReturns = $this->returnsTotals($previousStart, $previousEnd);

        $netRevenue = $sales['total'] - $returns['total'];
        $previousNetRevenue = $previousSales['total'] - $previousReturns['total'];

        return response()->json([
            'period' => $period,
            'has_data' => $sales['invoice_count'] > 0 || $returns['count'] > 0,
            'range' => $this->formatRange($start, $end),
            'previous_range' => $this->formatRange($previousStart, $previousEnd),
            'sales' => $sales,
            'returns' => [
                'total' => round($returns['total'], 2),
            ],
            'net_revenue' => round($netRevenue, 2),
            'comparison' => [
                'previous_sales_total' => round($previousSales['total'], 2),
                'previous_net_revenue' => round($previousNetRevenue, 2),
                'sales_total_change_percent' => $this->changePercent($sales['total'], $previousSales['total']),
                'net_revenue_change_percent' => $this->changePercent($netRevenue, $previousNetRevenue),
            ],
        ]);
    }

    public function cashiers(Request $request)
    {
        [$period, $start, $end] = $this->resolveRange($request);

        $performance = DB::table('invoices')
            ->join('users', 'users.id', '=', 'invoices.cashier_id')
            ->whereBetween('invoices.created_at', [$start, $end])
            ->select(
                'invoices.cashier_id',
                'users.name as cashier_name',
                DB::raw('COUNT(*) as invoice_count'),
                DB::raw('COALESCE(SUM(invoices.total), 0) as total_sales')
            )
            ->groupBy('invoices.cashier_id', 'users.name')
            ->orderByDesc('total_sales')
            ->get()
            ->map(fn ($row) => [
                'cashier_id' => (int) $row->cashier_id,
                'cashier_name' => $row->cashier_name,
                'invoice_count' => (int) $row->invoice_count,
                'total_sales' => round((float) $row->total_sales, 2),
                'average_invoice_value' => (int) $row->invoice_count > 0
                    ? round((float) $row->total_sales / (int) $row->invoice_count, 2)
                    : 0.0,
            ]);

        return response()->json([
            'period' => $period,
            'cashier_performance' => $performance,
        ]);
    }

    public function topProducts(Request $request)
    {
        [$period, $start, $end] = $this->resolveRange($request);
        $limit = max(1, min((int) $request->query('limit', 5), 50));

        $topSelling = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->whereBetween('invoices.created_at', [$start, $end])
            ->select(
                'invoice_items.product_id',
                'invoice_items.product_name',
                DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                DB::raw('SUM(invoice_items.line_total) as total_revenue')
            )
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'product_name' => $row->product_name,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue' => round((float) $row->total_revenue, 2),
            ]);

        $topReturned = DB::table('return_items')
            ->join('sale_returns', 'sale_returns.id', '=', 'return_items.sale_return_id')
            ->join('products', 'products.id', '=', 'return_items.product_id')
            ->whereBetween('sale_returns.created_at', [$start, $end])
            ->select(
                'return_items.product_id',
                'products.name as product_name',
                DB::raw('SUM(return_items.quantity) as total_quantity'),
                DB::raw('SUM(return_items.quantity * return_items.unit_price_snapshot) as total_amount')
            )
            ->groupBy('return_items.product_id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'product_name' => $row->product_name,
                'total_quantity' => (int) $row->total_quantity,
                'total_amount' => round((float) $row->total_amount, 2),
            ]);

        return response()->json([
            'period' => $period,
            'top_selling' => $topSelling,
            'top_returned' => $topReturned,
        ]);
    }

    public function history(Request $request)
    {
        $unit = in_array($request->query('unit'), ['day', 'week', 'month'], true)
            ? $request->query('unit')
            : 'day';
        $points = max(1, min((int) $request->query('points', 7), 31));

        $series = collect(range($points - 1, 0))->map(function ($offset) use ($unit) {
            $date = match ($unit) {
                'week' => Carbon::now()->subWeeks($offset),
                'month' => Carbon::now()->subMonthsNoOverflow($offset),
                default => Carbon::now()->subDays($offset),
            };

            [$start, $end, $label] = match ($unit) {
                'week' => [$date->copy()->startOfWeek(), $date->copy()->endOfWeek(), $date->format('Y-m-d')],
                'month' => [$date->copy()->startOfMonth(), $date->copy()->endOfMonth(), $date->format('Y-m')],
                default => [$date->copy()->startOfDay(), $date->copy()->endOfDay(), $date->format('Y-m-d')],
            };

            $sales = $this->salesTotals($start, $end);
            $returns = $this->returnsTotals($start, $end);

            return [
                'label' => $label,
                'sales_total' => $sales['total'],
                'sales_count' => $sales['invoice_count'],
                'net_revenue' => round($sales['total'] - $returns['total'], 2),
            ];
        });

        return response()->json($series);
    }

    private function salesTotals(Carbon $start, Carbon $end): array
    {
        $row = DB::table('invoices')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as invoice_count')
            ->first();

        return [
            'total' => round((float) $row->total, 2),
            'invoice_count' => (int) $row->invoice_count,
        ];
    }

    private function returnsTotals(Carbon $start, Carbon $end): array
    {
        $row = DB::table('sale_returns')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COALESCE(SUM(total_return_amount), 0) as total, COUNT(*) as count')
            ->first();

        return [
            'total' => round((float) $row->total, 2),
            'count' => (int) $row->count,
        ];
    }

    private function changePercent(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return $current == 0.0 ? 0.0 : null;
        }

        return round((($current - $previous) / abs($previous)) * 100, 1);
    }

    private function formatRange(Carbon $start, Carbon $end): array
    {
        return [
            'start' => $start->toDateTimeString(),
            'end' => $end->toDateTimeString(),
        ];
    }
}
