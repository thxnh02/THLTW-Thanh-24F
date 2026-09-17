<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Services\ProductImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductImportController extends Controller
{
    use ApiResponses;

    public function template(Request $request): StreamedResponse
    {
        abort_unless($request->user()->hasAdminPermission('catalog'), 403);

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['product_name', 'slug', 'category', 'brand', 'status', 'featured', 'sku', 'variant_name', 'price', 'sale_price', 'stock', 'short_description', 'description', 'image']);
            fputcsv($handle, ['San pham mau', 'san-pham-mau', 'Dien thoai', 'Apple', 'active', 'yes', 'SKU-DEMO-001', 'Tieu chuan', '1000000', '900000', '10', 'Mo ta ngan', 'Mo ta day du', '/product-placeholder.svg']);
            fclose($handle);
        }, 'product-import-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function preview(Request $request, ProductImportService $importService): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('catalog'), 403);

        $validated = $this->validated($request);

        return $this->success($importService->preview($validated['file'], $validated['mode']));
    }

    public function import(Request $request, ProductImportService $importService): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('catalog'), 403);

        $validated = $this->validated($request);

        return $this->success($importService->import($validated['file'], $validated['mode']), 'Da xu ly file CSV.');
    }

    /**
     * @return array{file:UploadedFile, mode:string}
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'mode' => ['required', 'in:create,update,upsert'],
        ]);
    }
}
