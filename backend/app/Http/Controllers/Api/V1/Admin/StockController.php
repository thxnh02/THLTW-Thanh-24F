<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockDocumentRequest;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\StockDocumentResource;
use App\Models\InventoryMovement;
use App\Models\StockDocument;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = StockDocument::query()->with(['items.variant.product', 'creator'])->latest('id');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('q')) {
            $query->where('code', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), StockDocumentResource::class);
    }

    public function store(StoreStockDocumentRequest $request, InventoryService $inventoryService): JsonResponse
    {
        $document = $inventoryService->createStockDocument($request->validated(), $request->user()->id);

        return $this->success(new StockDocumentResource($document), 'Đã ghi nhận phiếu kho.', status: 201);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::query()->with(['variant.product', 'creator'])->latest('id');

        if ($request->filled('variant_id')) {
            $query->where('product_variant_id', $request->integer('variant_id'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 20)), InventoryMovementResource::class);
    }
}
