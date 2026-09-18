<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountReturnController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $returns = ReturnRequest::query()
            ->with(['order:id,code,status,grand_total', 'items.orderItem'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate((int) $request->integer('per_page', 10));

        return $this->success($returns);
    }

    public function store(Request $request, ReturnService $returnService): JsonResponse
    {
        $validated = $request->validate([
            'order_code' => ['required', 'string', 'max:80'],
            'reason' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.reason' => ['nullable', 'string', 'max:120'],
            'items.*.condition_note' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->success($returnService->createForUser($request->user(), $validated), 'Đã gửi yêu cầu đổi trả.', status: 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $returnRequest = ReturnRequest::query()
            ->with(['order.items', 'items.orderItem'])
            ->where('user_id', $request->user()->id)
            ->where('code', $code)
            ->firstOrFail();

        return $this->success($returnRequest);
    }
}
