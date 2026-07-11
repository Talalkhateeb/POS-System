<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingController;

use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ReturnController;

use App\Http\Controllers\PermissionController;
use App\Http\Controllers\DashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/products', [ProductController::class, 'index']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('/invoices', [InvoiceController::class, 'store']);

    Route::post('/shifts/open', [ShiftController::class, 'open']);
    Route::post('/shifts/close', [ShiftController::class, 'close']);
    Route::get('/shifts/current', [ShiftController::class, 'current']);
    Route::get('/shifts/{shift}/movements', [ShiftController::class, 'movements']);

    Route::get('/returns', [ReturnController::class, 'index']);
    Route::post('/returns', [ReturnController::class, 'store']);
    Route::get('/returns/{saleReturn}', [ReturnController::class, 'show']);

    Route::get('/invoices/lookup/{invoiceNumber}', [InvoiceController::class, 'lookupByNumber']);


    Route::middleware(['admin'])->group(function () {
        Route::get('/permissions/users', [PermissionController::class, 'index']);
        Route::patch('/permissions/users/{user}', [PermissionController::class, 'update']);

        Route::apiResource('/users', UserController::class)->only(['index', 'store', 'update']);
        Route::apiResource('/products', ProductController::class)->only(['store', 'update']);

        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
        Route::get('/shifts', [ShiftController::class, 'index']);

        // UC-08 — Dashboard (FR-7.1–7.4), admin-only per UC-08 precondition
       Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
       Route::get('/dashboard/cashiers', [DashboardController::class, 'cashiers']);
       Route::get('/dashboard/top-products', [DashboardController::class, 'topProducts']);
    });
});