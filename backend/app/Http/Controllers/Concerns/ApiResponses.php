<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponses
{
    /**
     * @param  array<string, mixed>  $meta
     */
    protected function success(mixed $data = null, string $message = 'OK', array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => (object) $meta,
        ], $status);
    }

    /**
     * @param  class-string<JsonResource>  $resourceClass
     * @param  array<string, mixed>  $meta
     */
    protected function successPaginated(
        LengthAwarePaginator $paginator,
        string $resourceClass,
        string $message = 'OK',
        array $meta = [],
        int $status = 200,
    ): JsonResponse {
        $payload = $paginator->toArray();
        $payload['data'] = $resourceClass::collection($paginator->getCollection())->resolve(request());

        return $this->success($payload, $message, $meta, $status);
    }

    /**
     * @param  array<string, mixed>  $errors
     */
    protected function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => (object) $errors,
        ], $status);
    }
}
