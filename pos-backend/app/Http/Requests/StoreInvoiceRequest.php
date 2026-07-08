<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any active, authenticated user (admin or cashier) can complete a sale — UC-02 actor is "موظف الكاشير"
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'in:cash,card'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'يجب إضافة منتج واحد على الأقل للفاتورة',
            'items.*.product_id.exists' => 'أحد المنتجات المحددة غير موجود',
            'items.*.quantity.min' => 'الكمية يجب أن تكون واحد على الأقل',
        ];
    }
}