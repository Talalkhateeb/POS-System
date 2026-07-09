<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        // defense-in-depth, mirrors UC-01 / UC-07 pattern:
        // route middleware also enforces 'active', authorize() re-checks role
        return in_array($this->user()->role, ['admin', 'cashier'], true);
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_id.exists' => 'رقم الفاتورة غير موجود',
            'items.required' => 'يجب تحديد منتج واحد على الأقل للإرجاع',
        ];
    }
}