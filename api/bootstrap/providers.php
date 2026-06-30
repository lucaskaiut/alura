<?php

use App\Providers\AppServiceProvider;
use App\Providers\PaymentServiceProvider;
use App\Providers\RouterServiceProvider;
use App\Providers\ShippingServiceProvider;

return [
    AppServiceProvider::class,
    RouterServiceProvider::class,
    PaymentServiceProvider::class,
    ShippingServiceProvider::class,
];
