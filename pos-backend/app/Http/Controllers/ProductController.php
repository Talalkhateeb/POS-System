<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        return ProductResource::collection(
            Product::orderBy('name')->get()
        );
    }

    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();
        $existingProduct = Product::where('name', $validated['name'])->first();

        if ($existingProduct) {
            $existingProduct->fill([
                'category' => $validated['category'] ?? $existingProduct->category,
                'price' => $validated['price'],
                'min_stock_threshold' => $validated['min_stock_threshold'] ?? $existingProduct->min_stock_threshold,
                'is_active' => true,
            ]);
            $existingProduct->stock = (int) $existingProduct->stock + (int) $validated['stock'];
            $existingProduct->save();

            return (new ProductResource($existingProduct))
                ->additional(['message' => 'تم تحديث مخزون المنتج الموجود'])
                ->response();
        }

        return (new ProductResource(Product::create($validated)))
            ->additional(['message' => 'تمت إضافة المنتج بنجاح'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return new ProductResource($product);
    }
}
