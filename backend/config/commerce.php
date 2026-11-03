<?php

return [
    // Deliberately unavailable in production even if an env file is copied there.
    'cod_demo_enabled' => in_array(env('APP_ENV'), ['local', 'testing'], true) && (bool) env('COD_DEMO_ENABLED', false),
    'shipping_fee_vnd' => 0, // Fixed local demo fee; no carrier quote is represented.
    'order_email_enabled' => (bool) env('ORDER_EMAIL_ENABLED', false),
    'vnpay' => [
        'enabled' => (bool) env('VNPAY_ENABLED', false) && env('VNPAY_ENV', 'sandbox') === 'sandbox',
        'tmn_code' => env('VNPAY_TMN_CODE'),
        'hash_secret' => env('VNPAY_HASH_SECRET'),
        'payment_url' => env('VNPAY_PAYMENT_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        'return_url' => env('VNPAY_RETURN_URL'),
        'ipn_url' => env('VNPAY_IPN_URL'),
    ],
];
