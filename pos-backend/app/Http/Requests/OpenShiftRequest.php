<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'cashier'], true);
    }

    public function rules(): array
    {
        return [
            'opening_balance' => ['required', 'numeric', 'min:0'],
        ];
    }
}