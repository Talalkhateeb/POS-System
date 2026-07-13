<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'cashier'], true);
    }

    public function rules(): array
    {
        return [
            // actual counted cash the cashier reports at close-out
            'counted_balance' => ['required', 'numeric', 'min:0'],
        ];
    }
}