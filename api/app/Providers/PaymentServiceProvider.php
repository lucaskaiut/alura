<?php

namespace App\Providers;

use App\Core\Payment\PaymentCore;
use App\Gateways\Payment\BoletoGateway;
use App\Gateways\Payment\CreditCardGateway;
use App\Gateways\Payment\PixGateway;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentCore::class, function () {
            $core = new PaymentCore;

            $core->register(new PixGateway);
            $core->register(new CreditCardGateway);
            $core->register(new BoletoGateway);

            return $core;
        });
    }
}
