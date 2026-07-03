<?php

namespace App\Providers;

use App\Events\OrderStatusChanged;
use App\Events\ProductChanged;
use App\Listeners\SendOrderStatusNotification;
use App\Listeners\SyncProductListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(
            OrderStatusChanged::class,
            SendOrderStatusNotification::class,
        );

        Event::listen(
            ProductChanged::class,
            SyncProductListener::class,
        );

        Log::info('AppServiceProvider: event listeners registered.');
    }
}
