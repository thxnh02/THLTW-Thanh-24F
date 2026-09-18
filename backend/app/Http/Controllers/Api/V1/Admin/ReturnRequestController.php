<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReturnRequestController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('returns'), 403);

        $query = ReturnRequest::query()->with(['order:id,code,status,customer_name,grand_total', 'user:id,name,email'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $keyword = '%'.$request->string('q')->trim()->toString().'%';
            $query->where(function ($query) use ($keyword): void {
                $query->where('code', 'like', $keyword)
                    ->orWhereHas('order', fn ($orderQuery) => $orderQuery->where('code', 'like', $keyword)->orWhere('customer_name', 'like', $keyword));
            });
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function show(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('returns'), 403);

        return $this->success($returnRequest->load(['order.items', 'user', 'items.orderItem']));
    }

    public function updateStatus(Request $request, ReturnRequest $returnRequest, ReturnService $returnService): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('returns'), 403);

        $validated = $request->validate([
            'status' => ['nullable', 'in:requested,approved,rejected,received,completed,canceled'],
            'refund_status' => ['nullable', 'in:none,pending,refunded,failed'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        return $this->success($returnService->updateByAdmin($returnRequest, $request->user(), $validated), 'Đã cập nhật yêu cầu đổi trả.');
    }
}
