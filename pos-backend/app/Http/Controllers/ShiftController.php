<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\OpenShiftRequest;

use App\Http\Resources\ShiftResource;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function open(OpenShiftRequest $request): JsonResponse
    {
        $existing = Shift::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'يوجد لديك وردية مفتوحة بالفعل. يجب إغلاقها قبل فتح وردية جديدة.',
                'shift_id' => $existing->id,
            ], 422);
        }

        $shift = Shift::create([
            'cashier_id' => $request->user()->id,
            'opening_balance' => $request->validated()['opening_balance'],
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return (new ShiftResource($shift))->response()->setStatusCode(201);
    }

    public function close(CloseShiftRequest $request): JsonResponse
    {
        $shift = Shift::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (! $shift) {
            return response()->json([
                'message' => 'لا توجد وردية مفتوحة لإغلاقها.',
            ], 422);
        }

        $shift->load('cashMovements');
        $expected = $shift->expected_balance;
        $counted = $request->validated()['counted_balance'];
        $discrepancy = round($counted - $expected, 2);

        $shift->update([
            'closing_balance' => $counted,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return response()->json([
            'data' => new ShiftResource($shift),
            'expected_balance' => $expected,
            'counted_balance' => $counted,
            'discrepancy' => $discrepancy, // positive = surplus, negative = shortage
        ]);
    }

    // Current open shift for the logged-in cashier
    public function current(Request $request): JsonResponse
    {
        $shift = Shift::with('cashMovements')
            ->where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (! $shift) {
            return response()->json(['message' => 'لا توجد وردية مفتوحة حالياً.'], 404);
        }

        return response()->json([
            'data' => new ShiftResource($shift),
            'expected_balance' => $shift->expected_balance,
        ]);
    }

    // Cash movement history for a specific shift (admin or the owning cashier)
    public function movements(Shift $shift, Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin' && $request->user()->id !== $shift->cashier_id) {
            return response()->json(['message' => 'غير مصرح لك بعرض بيانات هذه الوردية.'], 403);
        }

        $movements = $shift->cashMovements()->latest()->get()->map(fn ($m) => [
            'id' => $m->id,
            'type' => $m->type,
            'amount' => $m->amount,
            'signed_amount' => $m->signed_amount,
            'reference_type' => class_basename($m->reference_type),
            'reference_id' => $m->reference_id,
            'created_at' => $m->created_at,
        ]);

        return response()->json([
            'shift' => new ShiftResource($shift),
            'expected_balance' => $shift->expected_balance,
            'movements' => $movements,
        ]);
    }

    // Admin: list all shifts (for dashboard/reporting later)
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        return ShiftResource::collection(
            Shift::with('cashier')->latest('opened_at')->paginate(20)
        );
    }
}