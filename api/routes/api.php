<?php

use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\AttributeValueController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerAddressController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderStatusController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PaymentConfigController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RouterController;
use App\Http\Controllers\Api\ShippingRuleController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

// =============================================
// Public — NO auth, no tenant required
// =============================================
Route::middleware('throttle:60,1')->post('/auth/login', [AuthController::class, 'login'])->name('login');

// Media serve — fully public, no auth, no tenant (browser <img> tags can't send headers)
Route::get('/media/{medium}/serve', [MediaController::class, 'serve'])->where('medium', '[0-9]+');

// =============================================
// Public — NO auth, tenant REQUIRED
// Store frontend: tenant via X-Tenant-Domain or host
// =============================================
Route::middleware(['tenant', 'throttle:300,1'])->group(function () {
    Route::get('/ping', fn () => response()->json([
        'status' => 'ok',
        'tenant_id' => tenant_id(),
        'tenant' => tenant()?->name,
    ]));

    Route::get('/router/resolve', [RouterController::class, 'resolve']);

    Route::get('/cart', [CartController::class, 'get']);
    Route::post('/cart/items', [CartController::class, 'addItem'])->middleware('throttle:30,1');
    Route::put('/cart/items/{cartItem}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::post('/cart/validate', [CartController::class, 'validateCart']);
    Route::post('/coupons/validate', [CouponController::class, 'validate']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);

    // Checkout
    Route::post('/checkout/shipping', [CheckoutController::class, 'shipping']);
    Route::get('/checkout/payment-methods', [CheckoutController::class, 'paymentMethods']);
    Route::post('/checkout', [CheckoutController::class, 'store']);

    // Webhooks
    Route::post('/webhooks/payment/{gateway}', [PaymentWebhookController::class, 'handle']);

    // Public store: products & categories (no auth, tenant via domain)
    Route::get('/store/products', [ProductController::class, 'storeIndex']);
    Route::get('/store/products/{product:slug}', [ProductController::class, 'storeShow']);

    // Store settings (public, for navbar menu)
    Route::get('/store/settings', fn () => response()->json([
        'menu' => \App\Models\MenuItem::toTree(
            \App\Models\MenuItem::where('active', true)->orderBy('position')->get()
        ),
    ]));

    // Customer auth — stricter rate limits
    Route::middleware('throttle:60,1')->post('/store/login', [CustomerAuthController::class, 'login']);
    Route::middleware('throttle:30,1')->post('/store/register', [CustomerAuthController::class, 'register']);
});

// Customer protected routes (auth via cookie → Bearer)
Route::middleware(['auth:sanctum', 'throttle:200,1'])->group(function () {
    Route::get('/store/me', [CustomerAuthController::class, 'me']);

    // Customer address management
    Route::get('/store/addresses', [CustomerAddressController::class, 'myAddresses']);
    Route::post('/store/addresses', [CustomerAddressController::class, 'myStore']);
    Route::put('/store/addresses/{address}', [CustomerAddressController::class, 'myUpdate']);
    Route::delete('/store/addresses/{address}', [CustomerAddressController::class, 'myDestroy']);
    Route::post('/store/addresses/{address}/default', [CustomerAddressController::class, 'setDefault']);
});

// =============================================
// Admin — auth REQUIRED, tenant REQUIRED
// Tenant via X-Tenant-Id header
// =============================================
Route::middleware(['auth:sanctum', 'verify.tenant', 'tenant', 'throttle:300,1'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('tenants', TenantController::class);
    Route::get('/tenants/{tenant}/settings', [TenantController::class, 'settings']);
    Route::put('/tenants/{tenant}/settings', [TenantController::class, 'updateSettings']);

    // Media Library
    Route::get('media', [MediaController::class, 'index']);
    Route::post('media', [MediaController::class, 'store']);
    Route::get('media/{medium}', [MediaController::class, 'show']);
    Route::delete('media/{medium}', [MediaController::class, 'destroy']);
    Route::post('media/bulk-delete', [MediaController::class, 'bulkDelete']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('brands', BrandController::class);

    Route::apiResource('attributes', AttributeController::class);
    Route::get('attributes/{attribute}/values', [AttributeValueController::class, 'index']);
    Route::post('attributes/{attribute}/values', [AttributeValueController::class, 'store']);
    Route::put('attributes/{attribute}/values/{value}', [AttributeValueController::class, 'update']);
    Route::delete('attributes/{attribute}/values/{value}', [AttributeValueController::class, 'destroy']);

    Route::apiResource('products', ProductController::class);

    Route::get('stock', [StockController::class, 'index']);
    Route::post('stock', [StockController::class, 'store']);
    Route::get('stock/{stock}/history', [StockController::class, 'history']);

    Route::apiResource('customers', CustomerController::class);
    Route::get('customers/{customer}/addresses', [CustomerAddressController::class, 'index']);
    Route::post('customers/{customer}/addresses', [CustomerAddressController::class, 'store']);
    Route::get('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'show']);
    Route::put('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'update']);
    Route::delete('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'destroy']);

    Route::apiResource('orders', OrderController::class)->only(['index', 'show']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    Route::apiResource('order-statuses', OrderStatusController::class);
    Route::get('/order-statuses/transitions/all', [OrderStatusController::class, 'allTransitions']);
    Route::get('/order-statuses/{orderStatus}/transitions', [OrderStatusController::class, 'transitions']);
    Route::post('/order-statuses/transitions', [OrderStatusController::class, 'storeTransition']);
    Route::delete('/order-statuses/transitions/{transition}', [OrderStatusController::class, 'destroyTransition']);

    Route::post('menu-items/reorder', [MenuItemController::class, 'reorder']);
    Route::apiResource('menu-items', MenuItemController::class);

    Route::apiResource('coupons', CouponController::class);
    Route::apiResource('pages', PageController::class);
    Route::apiResource('payment-configs', PaymentConfigController::class);
    Route::get('shipping-rules/gateways', [ShippingRuleController::class, 'gateways']);
    Route::apiResource('shipping-rules', ShippingRuleController::class);
    Route::apiResource('email-templates', EmailTemplateController::class);
});
