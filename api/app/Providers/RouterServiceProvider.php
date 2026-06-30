<?php

namespace App\Providers;

use App\Core\Router\Resolvers\CategoryResolver;
use App\Core\Router\Resolvers\DefaultResolver;
use App\Core\Router\Resolvers\PageResolver;
use App\Core\Router\Resolvers\ProductResolver;
use App\Core\Router\RouterService;
use Illuminate\Support\ServiceProvider;

class RouterServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RouterService::class, function () {
            $router = new RouterService;

            $router->register(new ProductResolver);
            $router->register(new CategoryResolver);
            $router->register(new PageResolver);
            $router->register(new DefaultResolver);

            return $router;
        });
    }
}
