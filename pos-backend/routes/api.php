<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/me', [AuthController::class, 'me']);

    // Readable by ANY authenticated, active user (admin or cashier) — UC-02 requires
    // the cashier to browse the catalog to build a sale. This line MUST sit here,
    // outside the admin group below, not inside it.
    Route::get('/products', [ProductController::class, 'index']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('/invoices', [InvoiceController::class, 'store']);

    Route::middleware(['admin'])->group(function () {
        Route::apiResource('/users', UserController::class)->only(['index', 'store', 'update']);
        // 'index' explicitly excluded from products here — it's registered above instead
        Route::apiResource('/products', ProductController::class)->only(['store', 'update']);

        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
    });
});