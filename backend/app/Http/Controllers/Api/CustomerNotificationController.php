<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CustomerNotification::query()->where('user_id', $request->user()->id);

        return response()->json(['data' => [
            'unread_count' => (clone $query)->whereNull('read_at')->count(),
            'notifications' => $query->orderByDesc('id')->paginate(10),
        ]]);
    }

    public function read(Request $request, int $notification): JsonResponse
    {
        $item = CustomerNotification::query()->where('user_id', $request->user()->id)->whereKey($notification)->firstOrFail();
        if ($item->read_at === null) {
            $item->read_at = now();
            $item->save();
        }

        return response()->json(['data' => ['notification' => $item]]);
    }
}
