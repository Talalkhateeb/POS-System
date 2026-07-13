<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;

class SettingController extends Controller
{
   public function show()
{
    return new SettingResource(Setting::current());
}

public function update(UpdateSettingRequest $request)
{
    $setting = Setting::current();
    $setting->update($request->validated());

    return new SettingResource($setting);
}
}