<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReturnStatusRequest;
use App\Http\Resources\ReturnRequestResource;
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

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), ReturnRequestResource::class);
    }

    public function show(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('returns'), 403);

        return $this->success(new ReturnRequestResource($returnRequest->load(['order.items', 'user', 'items.orderItem'])));
    }

    public function updateStatus(UpdateReturnStatusRequest $request, ReturnRequest $returnRequest, ReturnService $returnService): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('returns'), 403);

        $validated = $request->validated();

        return $this->success(new ReturnRequestResource($returnService->updateByAdmin($returnRequest, $request->user(), $validated)), 'Đã cập nhật yêu cầu đổi trả.');
    }
}
