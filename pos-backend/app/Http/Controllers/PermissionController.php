<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePermissionRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    // UC-06 step 1-2: list cashier accounts the manager can configure
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'غير مصرح لك بهذه العملية'], 403);
        }

        $cashiers = User::where('role', 'cashier')
            ->get(['id', 'name', 'username', 'is_active', 'can_return_without_approval']);

        return response()->json(['data' => $cashiers]);
    }

    // UC-06 step 3-4: update a specific cashier's permission
    public function update(UpdatePermissionRequest $request, User $user): JsonResponse
    {
        if ($user->role !== 'cashier') {
            return response()->json([
                'message' => 'لا يمكن تعديل صلاحيات حساب مدير عبر هذه الشاشة',
            ], 422);
        }

        $user->update([
            'can_return_without_approval' => $request->validated()['can_return_without_approval'],
        ]);

        return response()->json([
            'message' => 'تم تحديث الصلاحيات بنجاح',
            'data' => $user->only(['id', 'name', 'username', 'can_return_without_approval']),
        ]);
    }
}