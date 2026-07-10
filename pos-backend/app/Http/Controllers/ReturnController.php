<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReturnRequest;
use App\Http\Resources\ReturnResource;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\SaleReturn;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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

    public function store(StoreReturnRequest $request): \Illuminate\Http\JsonResponse
    {
        // ... rest exactly as you pasted, unchanged
    $validated = $request->validated();

    // UC-03b: verify manager confirmation if this cashier needs approval
    $needsApproval = $request->user()->role === 'cashier'
        && ! $request->user()->can_return_without_approval;

    if ($needsApproval) {
        $manager = User::where('username', $validated['manager_username'])
            ->where('role', 'admin')
            ->where('is_active', true)
            ->first();

        if (! $manager || ! Hash::check($validated['manager_password'], $manager->password)) {
            return response()->json([
                'message' => 'بيانات تأكيد المدير غير صحيحة',
            ], 403);
        }
    }

    return DB::transaction(function () use ($validated, $request) {
        $invoice = Invoice::with('items')->findOrFail($validated['invoice_id']);

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
            $invoiceItem = $invoice->items->firstWhere('product_id', $line['product_id']);

            if (! $invoiceItem) {
                return response()->json([
                    'message' => "المنتج رقم {$line['product_id']} لم يكن ضمن بنود الفاتورة رقم {$invoice->id}.",
                ], 422);
            }

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
            Product::whereKey($item['product_id'])->increment('quantity', $item['quantity']);
        }

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
}