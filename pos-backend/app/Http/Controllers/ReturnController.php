<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReturnRequest;
use App\Http\Resources\ReturnResource;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\SaleReturn;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    public function store(StoreReturnRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated, $request) {
            $invoice = Invoice::with('items')->findOrFail($validated['invoice_id']);

            // UC-03b: return not allowed without an active shift for this cashier
            $activeShift = Shift::where('cashier_id', $request->user()->id)
                ->where('status', 'open')
                ->first();

            if (! $activeShift) {
                return response()->json([
                    'message' => 'لا توجد وردية مفتوحة لهذا المستخدم. لا يمكن تنفيذ عملية إرجاع دون وردية نشطة.',
                ], 422);
            }

            $totalAmount = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $line) {
                // UC-03a: verify the product was actually part of this invoice
                $invoiceItem = $invoice->items->firstWhere('product_id', $line['product_id']);

                if (! $invoiceItem) {
                    return response()->json([
                        'message' => "المنتج رقم {$line['product_id']} لم يكن ضمن بنود الفاتورة رقم {$invoice->id}.",
                    ], 422);
                }

                // FR-5.4: quantity requested cannot exceed (sold - already returned)
                $alreadyReturned = ReturnItem::whereHas(
                    'saleReturn',
                    fn ($q) => $q->where('invoice_id', $invoice->id)
                )->where('product_id', $line['product_id'])->sum('quantity');

                $availableToReturn = $invoiceItem->quantity - $alreadyReturned;

                if ($line['quantity'] > $availableToReturn) {
                    return response()->json([
                        'message' => 'الكمية المطلوب إرجاعها تتجاوز الكمية المباعة',
                        'product_id' => $line['product_id'],
                        'available_to_return' => $availableToReturn,
                    ], 422);
                }

                $lineTotal = $invoiceItem->unit_price_snapshot * $line['quantity'];
                $totalAmount += $lineTotal;

                $itemsToCreate[] = [
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'unit_price_snapshot' => $invoiceItem->unit_price_snapshot,
                ];
            }

            $saleReturn = SaleReturn::create([
                'invoice_id' => $invoice->id,
                'cashier_id' => $request->user()->id,
                'shift_id' => $activeShift->id,
                'total_return_amount' => $totalAmount,
            ]);

            foreach ($itemsToCreate as $item) {
                $saleReturn->items()->create($item);

                // UC-02a mirror: increment stock back
                Product::whereKey($item['product_id'])->increment('quantity', $item['quantity']);
            }

            // UC-04: cash movement via polymorphic relation, amount always positive
            $saleReturn->cashMovements()->create([
                'shift_id' => $activeShift->id,
                'cashier_id' => $request->user()->id,
                'type' => 'return',
                'amount' => $totalAmount,
            ]);

            return (new ReturnResource($saleReturn->load('items.product', 'invoice', 'cashier')))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function show(SaleReturn $saleReturn): ReturnResource
    {
        return new ReturnResource(
            $saleReturn->load('items.product', 'invoice', 'cashier', 'shift')
        );
    }

    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        return ReturnResource::collection(
            SaleReturn::with('items.product', 'invoice', 'cashier')
                ->latest()
                ->paginate(20)
        );
    }
}