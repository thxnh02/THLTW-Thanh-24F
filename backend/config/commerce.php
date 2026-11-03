<?php

return [
    // COD collects payment on delivery; legacy COD_DEMO_ENABLED remains a fallback for existing local installs.
    'cod_enabled' => (bool) env('COD_ENABLED', env('COD_DEMO_ENABLED', false)),
    'shipping_fee_vnd' => 0, // Fixed local demo fee; no carrier quote is represented.
    'order_email_enabled' => (bool) env('ORDER_EMAIL_ENABLED', false),
    'order_admin_email' => env('ORDER_ADMIN_EMAIL'),
    'order_email_max_attempts' => max(1, (int) env('ORDER_EMAIL_MAX_ATTEMPTS', 3)),
    'order_email_backoff_seconds' => array_map('intval', explode(',', (string) env('ORDER_EMAIL_BACKOFF_SECONDS', '60,300,900'))),
    'order_email_stale_after_seconds' => max(60, (int) env('ORDER_EMAIL_STALE_AFTER_SECONDS', 300)),
    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:3000'), '/'),
    'vnpay' => [
        'enabled' => (bool) env('VNPAY_ENABLED', false) && env('VNPAY_ENV', 'sandbox') === 'sandbox',
        'query_enabled' => (bool) env('VNPAY_QUERY_ENABLED', false) && env('VNPAY_ENV', 'sandbox') === 'sandbox',
        'query_url' => env('VNPAY_QUERY_URL', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),
        'query_ip' => env('VNPAY_QUERY_IP', '127.0.0.1'),
        'tmn_code' => env('VNPAY_TMN_CODE'),
        'hash_secret' => env('VNPAY_HASH_SECRET'),
        'payment_url' => env('VNPAY_PAYMENT_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        'return_url' => env('VNPAY_RETURN_URL'),
        'ipn_url' => env('VNPAY_IPN_URL'),
    ],
];
