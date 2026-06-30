<?php

namespace App\Providers;

use App\Core\Shipping\ShippingCore;
use App\Gateways\Shipping\CorreiosGateway;
use App\Gateways\Shipping\FixedShippingGateway;
use Illuminate\Support\ServiceProvider;

class ShippingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ShippingCore::class, function () {
            $core = new ShippingCore;

            $core->register(new FixedShippingGateway);
            $core->register(new CorreiosGateway);

            return $core;
        });
    }
}
