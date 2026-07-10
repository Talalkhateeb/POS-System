<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'cashier'], true);
    }

    public function rules(): array
    {
        // UC-03b: if this cashier lacks the "return without approval" permission,
        // manager confirmation credentials become required on this request.
        $needsApproval = $this->user()->role === 'cashier'
            && ! $this->user()->can_return_without_approval;

        return [
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'manager_username' => [$needsApproval ? 'required' : 'nullable', 'string'],
            'manager_password' => [$needsApproval ? 'required' : 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_id.exists' => 'رقم الفاتورة غير موجود',
            'items.required' => 'يجب تحديد منتج واحد على الأقل للإرجاع',
            'manager_username.required' => 'يجب الحصول على تأكيد المدير قبل المتابعة',
            'manager_password.required' => 'يجب الحصول على تأكيد المدير قبل المتابعة',
        ];
    }
}