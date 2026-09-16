<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'ORD-'.now()->format('ymd').'-'.fake()->unique()->regexify('[A-Z0-9]{6}'),
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => fake()->numerify('09########'),
            'shipping_address' => fake()->address(),
            'subtotal' => 100000,
            'discount_total' => 0,
            'shipping_fee' => 0,
            'grand_total' => 100000,
        ];
    }
}
