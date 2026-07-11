<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Whitelist of accepted periods. Anything else safely falls back to 'today'
     * instead of blowing up inside Carbon's ->startOf() / ->subX() calls.
     */
    private const VALID_PERIODS = ['today', 'week', 'month'];

    private function resolveRange(Request $request): array
    {
        $period = $request->query('period', 'today');

        if (! in_array($period, self::VALID_PERIODS, true)) {
            $period = 'today';
        }

        $end = Carbon::now()->endOfDay();

        $start = match ($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            default => Carbon::now()->startOfDay(),
        };

        return [$period, $start, $end];
    }

    // GET /dashboard/summary?period=today|week|month
    public function summary(Request $request)
    {
        [$period, $start, $end] = $this->resolveRange($request);

        $invoices = Invoice::whereBetween('created_at', [$start, $end]);

        $salesTotal = (clone $invoices)->sum('total');
        $salesCount = (clone $invoices)->count();

        // Returns table/model referenced defensively — adjust to your actual
        // SaleReturn model + column names once confirmed.
        $returnsTotal = class_exists(\App\Models\SaleReturn::class)
            ? \App\Models\SaleReturn::whereBetween('created_at', [$start, $end])->sum('total_amount')
            : 0;

        return response()->json([
            'period' => $period,
            'range' => [
                'start' => $start->toDateTimeString(),
                'end' => $end->toDateTimeString(),
            ],
            'sales' => [
                'total' => (float) $salesTotal,
                'count' => $salesCount,
            ],
            'returns' => [
                'total' => (float) $returnsTotal,
            ],
            'net_revenue' => (float) $salesTotal - (float) $returnsTotal,
        ]);
    }

    // GET /dashboard/cashiers?period=today|week|month
    public function cashiers(Request $request)
    {
        [$period, $start, $end] = $this->resolveRange($request);

        $performance = Invoice::whereBetween('created_at', [$start, $end])
            ->select('cashier_id', DB::raw('COUNT(*) as invoice_count'), DB::raw('SUM(total) as total_sales'))
            ->groupBy('cashier_id')
            ->with('cashier:id,name') // eager load to avoid N+1 / null->name crashes
            ->get()
            ->map(function ($row) {
                $count = (int) $row->invoice_count;
                $total = (float) $row->total_sales;

                return [
                    'cashier_id' => $row->cashier_id,
                    'cashier_name' => optional($row->cashier)->name ?? 'غير معروف',
                    'invoice_count' => $count,
                    'total_sales' => $total,
                    // guard against division by zero when a cashier somehow has 0 invoices
                    'average_invoice_value' => $count > 0 ? round($total / $count, 2) : 0,
                ];
            });

        return response()->json([
            'period' => $period,
            'cashier_performance' => $performance,
        ]);
    }

    // GET /dashboard/top-products?period=today|week|month&limit=5
    public function topProducts(Request $request)
    {
        [$period, $start, $end] = $this->resolveRange($request);

        $limit = (int) $request->query('limit', 5);
        $limit = $limit > 0 && $limit <= 50 ? $limit : 5; // clamp, never trust raw input

        $topSelling = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->whereBetween('invoices.created_at', [$start, $end])
            ->select('invoice_items.product_id', 'invoice_items.product_name', DB::raw('SUM(invoice_items.quantity) as total_qty'))
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        $topReturned = class_exists(\App\Models\SaleReturnItem::class)
            ? DB::table('sale_return_items')
                ->join('sale_returns', 'sale_returns.id', '=', 'sale_return_items.sale_return_id')
                ->whereBetween('sale_returns.created_at', [$start, $end])
                ->select('sale_return_items.product_id', 'sale_return_items.product_name', DB::raw('SUM(sale_return_items.quantity) as total_qty'))
                ->groupBy('sale_return_items.product_id', 'sale_return_items.product_name')
                ->orderByDesc('total_qty')
                ->limit($limit)
                ->get()
            : collect();

        return response()->json([
            'period' => $period,
            'top_selling' => $topSelling,
            'top_returned' => $topReturned,
        ]);
    }
}