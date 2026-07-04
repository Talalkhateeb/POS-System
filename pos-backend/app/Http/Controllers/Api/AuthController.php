<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // UC-01: تسجيل الدخول
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $user = User::where('username', $request->username)->first();

        // A1: بيانات دخول خاطئة
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'اسم المستخدم أو كلمة السر غير صحيحة'], 401);
        }

        // A3: حساب معطّل
        if (! $user->is_active) {
            return response()->json(['message' => 'هذا الحساب غير مفعّل، الرجاء مراجعة الإدارة'], 403);
        }

        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'must_change_password' => $user->must_change_password, // A2
            ],
            'token' => $token,
        ]);
    }

    // A2: تعيين كلمة سر جديدة بعد أول دخول
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $user = $request->user();
        $user->password = $request->new_password;
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'تم تحديث كلمة السر بنجاح']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج']);
    }
}