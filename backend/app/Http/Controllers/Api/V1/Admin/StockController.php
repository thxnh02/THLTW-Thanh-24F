<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Models\StockDocument;
use App\Models\StockDocumentItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:import,export'],
            'supplier' => ['nullable', 'string', 'max:180'],
            'reason' => ['nullable', 'string', 'max:180'],
            'note' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $document = DB::transaction(function () use ($validated, $request): StockDocument {
            $document = StockDocument::create([
                'type' => $validated['type'],
                'code' => $this->generateCode($validated['type']),
                'supplier' => $validated['supplier'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'note' => $validated['note'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['items'] as $line) {
                $variant = ProductVariant::query()->lockForUpdate()->findOrFail($line['product_variant_id']);
                $quantity = (int) $line['quantity'];
                $change = $validated['type'] === 'import' ? $quantity : -$quantity;

                if ($change < 0 && $variant->stock_quantity < $quantity) {
                    abort(409, 'Ton kho SKU '.$variant->sku.' khong du de xuat.');
                }

                $variant->increment('stock_quantity', $change);
                $variant->refresh();

                StockDocumentItem::create([
                    'stock_document_id' => $document->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'unit_cost' => $line['unit_cost'] ?? null,
                ]);

                InventoryMovement::create([
                    'product_variant_id' => $variant->id,
                    'quantity_change' => $change,
                    'balance_after' => $variant->stock_quantity,
                    'reason' => 'stock_'.$validated['type'],
                    'source_type' => StockDocument::class,
                    'source_id' => $document->id,
                    'created_by' => $request->user()->id,
                ]);
            }

            return $document->load(['items.variant.product', 'creator']);
        });

        return $this->success($document, 'Da ghi nhan phieu kho.', status: 201);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::query()->with(['variant.product', 'creator'])->latest('id');

        if ($request->filled('variant_id')) {
            $query->where('product_variant_id', $request->integer('variant_id'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 20)));
    }

    private function generateCode(string $type): string
    {
        do {
            $code = strtoupper(substr($type, 0, 3)).'-'.now()->format('ymd').'-'.Str::upper(Str::random(5));
        } while (StockDocument::query()->where('code', $code)->exists());

        return $code;
    }
}
