<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReturnRequest;
use App\Models\CashMovement;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\SaleReturn;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $query = SaleReturn::with(['items', 'invoice', 'cashier'])->latest();

        if ($user->role === 'cashier') {
            $query->where('cashier_id', $user->id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function show(SaleReturn $saleReturn)
    {
        $user = request()->user();

        if ($user->role === 'cashier' && $saleReturn->cashier_id !== $user->id) {
            abort(403, 'لا يمكنك عرض مرتجعات كاشير آخر');
        }

        return response()->json(['data' => $saleReturn->load(['items', 'invoice', 'cashier'])]);
    }

    public function store(StoreReturnRequest $request)
    {
        $saleReturn = DB::transaction(function () use ($request) {
            $user = $request->user();

            $openShift = Shift::where('cashier_id', $user->id)
                ->where('status', 'open')
                ->first();

            if (! $openShift) {
                throw ValidationException::withMessages([
                    'shift' => 'لا يمكن تنفيذ عملية إرجاع دون فتح وردية.',
                ]);
            }

            $invoice = Invoice::with('items')->lockForUpdate()->findOrFail($request->invoice_id);

            $requestedItems = collect($request->items);
            $totalReturnAmount = 0;
            $preparedLines = [];
            $requestedItems = collect($request->items);
            $totalReturnAmount = 0;
            $preparedLines = [];
            $taxRate = $invoice->tax_rate_applied;
            
            foreach ($requestedItems as $item) {
                $productId = (int) $item['product_id'];
                $requestedQty = (int) $item['quantity'];

                $invoiceItem = $invoice->items->firstWhere('product_id', $productId);

                if (! $invoiceItem) {
                    throw ValidationException::withMessages([
                        'items' => "المنتج رقم {$productId} غير موجود ضمن هذه الفاتورة",
                    ]);
                }

                // Lock existing return_items for this invoice+product to prevent
                // a race where two concurrent returns both pass the check.
                $alreadyReturned = ReturnItem::whereHas('saleReturn', function ($q) use ($invoice) {
                    $q->where('invoice_id', $invoice->id)->lockForUpdate();
                })->where('product_id', $productId)->sum('quantity');

                $remaining = $invoiceItem->quantity - $alreadyReturned;

                if ($requestedQty > $remaining) {
                    throw ValidationException::withMessages([
                        'items' => "الكمية المطلوب إرجاعها ({$requestedQty}) للمنتج \"{$invoiceItem->product_name}\" تتجاوز الكمية المتاحة للإرجاع ({$remaining})",
                    ]);
                }

                $unitPrice = $invoiceItem->price_at_sale; // FR-4.5 snapshot, never Product::price
                $baseAmount = $unitPrice * $requestedQty;
                $taxPortion = round($baseAmount * ($taxRate / 100), 2);
                $lineTotalWithTax = $baseAmount + $taxPortion;
                $totalReturnAmount += $lineTotalWithTax;

                $preparedLines[] = [
                    'product_id' => $productId,
                    'quantity' => $requestedQty,
                    'unit_price_snapshot' => $unitPrice, // stays bare unit price — a product fact, not a cash-register fact
                ];
            }

            $saleReturn = SaleReturn::create([
                'invoice_id' => $invoice->id,
                'cashier_id' => $user->id,
                'shift_id' => $openShift->id,
                'total_return_amount' => $totalReturnAmount,
            ]);

            foreach ($preparedLines as $line) {
                $saleReturn->items()->create($line);

                // FR-5.2: restore stock
                Product::where('id', $line['product_id'])
                    ->lockForUpdate()
                    ->increment('stock', $line['quantity']);
            }

            // FR-5.3: withdraw from cash balance
            CashMovement::create([
                'shift_id' => $openShift->id,
                'cashier_id' => $user->id,
                'type' => 'return',
                'amount' => $totalReturnAmount,
                'reference_id' => $saleReturn->id,
                'reference_type' => SaleReturn::class,
            ]);

            return $saleReturn;
        });

        return response()->json([
            'data' => $saleReturn->load(['items', 'invoice']),
        ], 201);
    }
}