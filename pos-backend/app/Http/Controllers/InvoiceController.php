<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $query = Invoice::with(['cashier', 'items'])->latest();

        // "يعرض فواتيره الخاصة فقط" — cashier sees only their own invoices, admin sees all
        if ($user->role === 'cashier') {
            $query->where('cashier_id', $user->id);
        }

        return InvoiceResource::collection($query->get());
    }

    public function show(Invoice $invoice)
    {
        $user = request()->user();

        if ($user->role === 'cashier' && $invoice->cashier_id !== $user->id) {
            abort(403, 'لا يمكنك عرض فواتير كاشير آخر');
        }

        return new InvoiceResource($invoice->load(['cashier', 'items']));
    }

    public function store(StoreInvoiceRequest $request)
    {
        $invoice = DB::transaction(function () use ($request) {
            $settings = Setting::current();
            $subtotal = 0;
            $lineItems = [];

            $requestedItems = collect($request->items)->map(function ($item) {
                return [
                    'product_id' => (int) $item['product_id'],
                    'quantity' => (int) $item['quantity'],
                ];
            });

            $requestedTotals = [];
            foreach ($requestedItems as $item) {
                $requestedTotals[$item['product_id']] = ($requestedTotals[$item['product_id']] ?? 0) + $item['quantity'];
            }

            $products = Product::whereIn('id', array_keys($requestedTotals))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($requestedTotals as $productId => $requiredQuantity) {
                $product = $products->get($productId);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => 'أحد المنتجات المحددة غير موجود',
                    ]);
                }

                if (!$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => "المنتج \"{$product->name}\" لم يعد متوفراً للبيع",
                    ]);
                }

                if ((int) $product->stock < $requiredQuantity) {
                    throw ValidationException::withMessages([
                        'items' => "الكمية المطلوبة من \"{$product->name}\" ({$requiredQuantity}) تتجاوز المتوفر بالمخزون ({$product->stock})",
                    ]);
                }
            }

            foreach ($requestedItems as $item) {
                $product = $products->get($item['product_id']);
                $quantity = $item['quantity'];
                $lineTotal = $product->price * $quantity;
                $subtotal += $lineTotal;

                $lineItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'price_at_sale' => $product->price,
                    'line_total' => $lineTotal,
                ];
            }

            $taxRate = $settings->tax_enabled ? $settings->tax_rate : 0;
            $taxAmount = round($subtotal * ($taxRate / 100), 2);
            $total = $subtotal + $taxAmount;

            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'cashier_id' => $request->user()->id,
                'subtotal' => $subtotal,
                'tax_rate_applied' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'payment_method' => $request->payment_method,
            ]);

            foreach ($lineItems as $line) {
                $invoice->items()->create([
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'price_at_sale' => $line['price_at_sale'],
                    'quantity' => $line['quantity'],
                    'line_total' => $line['line_total'],
                ]);

                // FR-4.4: decrement stock atomically, inside the same locked transaction
                $line['product']->decrement('stock', $line['quantity']);
            }

            return $invoice;
        });

        return (new InvoiceResource($invoice->load(['cashier', 'items'])))
            ->response()
            ->setStatusCode(201);
    }

    private function generateInvoiceNumber(): string
    {
        $lastId = Invoice::max('id') ?? 0;
        return 'INV-' . str_pad((string) ($lastId + 1), 6, '0', STR_PAD_LEFT);
    }
}