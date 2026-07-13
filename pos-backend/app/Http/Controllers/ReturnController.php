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
use Illuminate\Validation\ValidationException;

class ReturnController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $query = SaleReturn::with(['items.product', 'invoice', 'cashier'])->latest();

        if ($user->role === 'cashier') {
            $query->where('cashier_id', $user->id);
        }

        return ReturnResource::collection($query->get());
    }

    public function show(SaleReturn $saleReturn)
    {
        $user = request()->user();

        if ($user->role === 'cashier' && $saleReturn->cashier_id !== $user->id) {
            abort(403, 'You cannot view returns for another cashier.');
        }

        return new ReturnResource($saleReturn->load(['items.product', 'invoice', 'cashier']));
    }

    public function store(StoreReturnRequest $request)
    {
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
                    'message' => 'Manager verification credentials are incorrect.',
                ], 403);
            }
        }

        $saleReturn = DB::transaction(function () use ($validated, $request) {
            $invoice = Invoice::with('items')->findOrFail($validated['invoice_id']);

            $activeShift = Shift::where('cashier_id', $request->user()->id)
                ->where('status', 'open')
                ->first();

            if (! $activeShift) {
                throw ValidationException::withMessages([
                    'shift' => 'No open shift exists for this user. Returns cannot be processed without an active shift.',
                ]);
            }

            $totalAmount = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $line) {
                $invoiceItem = $invoice->items->firstWhere('product_id', $line['product_id']);

                if (! $invoiceItem) {
                    throw ValidationException::withMessages([
                        'items' => "Product id {$line['product_id']} was not part of invoice {$invoice->id}.",
                    ]);
                }

                // A2 (UC-03): return quantity greater than sold — sum against ALL prior returns on this invoice, not just this request
                $alreadyReturned = ReturnItem::whereHas(
                    'saleReturn',
                    fn ($q) => $q->where('invoice_id', $invoice->id)
                )->where('product_id', $line['product_id'])->sum('quantity');

                $availableToReturn = $invoiceItem->quantity - $alreadyReturned;

                if ($line['quantity'] > $availableToReturn) {
                    throw ValidationException::withMessages([
                        'items' => "The requested return quantity ({$line['quantity']}) exceeds the available return quantity ({$availableToReturn}) for product id {$line['product_id']}.",
                    ]);
                }

                // FR-4.5 / Snapshot Price: return uses the price the customer actually paid, not today's product price
                $lineTotal = $invoiceItem->price_at_sale * $line['quantity'];
                $totalAmount += $lineTotal;

                $itemsToCreate[] = [
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'unit_price_snapshot' => $invoiceItem->price_at_sale,
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

                // FR-5.2: return quantity to stock — column is `stock`, not `quantity`
                Product::whereKey($item['product_id'])->increment('stock', $item['quantity']);
            }

            // FR-5.3 / FR-6.3: log the cash-out against the shift, linked back to this return
            $saleReturn->cashMovements()->create([
                'shift_id' => $activeShift->id,
                'cashier_id' => $request->user()->id,
                'type' => 'return',
                'amount' => $totalAmount,
            ]);

            return $saleReturn;
        });

        return (new ReturnResource($saleReturn->load('items.product', 'invoice', 'cashier')))
            ->response()
            ->setStatusCode(201);
    }
}