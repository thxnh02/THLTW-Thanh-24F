<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Models\StockDocument;
use App\Models\StockDocumentItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryService
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function createStockDocument(array $validated, int $userId): StockDocument
    {
        return DB::transaction(function () use ($validated, $userId): StockDocument {
            $document = StockDocument::create([
                'type' => $validated['type'],
                'code' => $this->generateCode($validated['type']),
                'supplier' => $validated['supplier'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'note' => $validated['note'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($validated['items'] as $line) {
                $variant = ProductVariant::query()->lockForUpdate()->findOrFail($line['product_variant_id']);
                $quantity = (int) $line['quantity'];
                $change = $validated['type'] === 'import' ? $quantity : -$quantity;

                if ($change < 0 && $variant->stock_quantity < $quantity) {
                    abort(409, 'Tồn kho SKU '.$variant->sku.' không đủ để xuất.');
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
                    'created_by' => $userId,
                ]);
            }

            return $document->load(['items.variant.product', 'creator']);
        });
    }

    private function generateCode(string $type): string
    {
        do {
            $code = strtoupper(substr($type, 0, 3)).'-'.now()->format('ymd').'-'.Str::upper(Str::random(5));
        } while (StockDocument::query()->where('code', $code)->exists());

        return $code;
    }
}
