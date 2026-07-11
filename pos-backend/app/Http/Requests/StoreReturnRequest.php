<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        // UC-03 actor: موظف الكاشير / مدير النظام — any active authenticated user
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $needsApproval = $this->user()?->role === 'cashier'
            && ! $this->user()->can_return_without_approval;

        return [
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'manager_username' => [$needsApproval ? 'required' : 'sometimes', 'string'],
            'manager_password' => [$needsApproval ? 'required' : 'sometimes', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_id.exists' => 'رقم الفاتورة غير موجود',
            'items.required' => 'يجب تحديد منتج واحد على الأقل للإرجاع',
            'manager_username.required' => 'يتطلب هذا الإرجاع تأكيد المدير',
            'manager_password.required' => 'يتطلب هذا الإرجاع تأكيد المدير',
        ];
    }
}