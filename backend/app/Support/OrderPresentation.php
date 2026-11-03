<?php

namespace App\Support;

use App\Models\Order;

class OrderPresentation
{
    public static function paymentLabel(Order $order): string
    {
        if ($order->status === 'cancelled' && $order->payment_method === 'cod') {
            return 'Đơn hàng đã hủy';
        }

        if ($order->payment_method === 'cod' && in_array($order->payment_status, ['pending', 'demo_paid'], true)) {
            return 'Thanh toán khi nhận hàng';
        }

        if ($order->payment_method === 'vnpay' && $order->payment_status === 'paid') {
            return 'Thanh toán thành công qua VNPay';
        }

        return match ($order->payment_status) {
            'pending' => $order->payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Đang chờ xác nhận thanh toán',
            'failed' => 'Thanh toán không thành công',
            'needs_review' => 'Giao dịch cần kiểm tra',
            default => $order->payment_status ?? 'Đơn cũ chưa có dữ liệu thanh toán',
        };
    }

    public static function fulfillmentLabel(Order $order): string
    {
        if ($order->status === 'cancelled') {
            return 'Đơn hàng đã hủy';
        }

        return match ($order->status) {
            'pending' => 'Đơn hàng đang chờ xử lý',
            'processing' => 'Đơn hàng đang được xử lý',
            'delivered' => 'Đơn hàng đã giao',
            default => $order->status ?? 'Chưa có dữ liệu trạng thái đơn',
        };
    }

    public static function methodLabel(Order $order): string
    {
        return match ($order->payment_method) {
            'vnpay' => 'VNPay',
            'cod' => 'COD',
            default => 'Đơn cũ',
        };
    }
}
