<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_list_supports_filter_search_sort_and_pagination(): void
    {
        $this->seed();

        $response = $this->getJson('/api/v1/products?q=iphone&sort=price_asc&per_page=6');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'category', 'brand', 'default_variant', 'price', 'stock_quantity'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('meta.total'));
    }
}
