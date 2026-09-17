<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\CustomerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountNotificationController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest();

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)), meta: [
            'unread_count' => CustomerNotification::query()
                ->where('user_id', $request->user()->id)
                ->whereNull('read_at')
                ->count(),
        ]);
    }

    public function markRead(Request $request, CustomerNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 404);

        $notification->update(['read_at' => now()]);

        return $this->success($notification->refresh(), 'Da danh dau da doc.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success(null, 'Da danh dau tat ca thong bao.');
    }
}
