<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'tax_enabled' => ['required', 'boolean'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'store_name' => ['required', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:10'],
            'invoice_header' => ['nullable', 'string', 'max:255'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ];
    }
}