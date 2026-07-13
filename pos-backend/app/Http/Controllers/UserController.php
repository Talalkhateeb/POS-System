<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        return UserResource::collection(User::orderBy('name')->get());
    }

    public function store(StoreUserRequest $request)
    {
        $tempPassword = Str::random(10);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($tempPassword),
            'is_active' => true,
            'must_change_password' => true,
        ]);

        return (new UserResource($user))
            ->additional(['temp_password' => $tempPassword])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->only(['name', 'email', 'role', 'is_active']));

        return new UserResource($user);
    }
}