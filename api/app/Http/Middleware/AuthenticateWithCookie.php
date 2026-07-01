<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AuthenticateWithCookie
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->bearerToken() && $request->hasCookie('alura_token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->cookie('alura_token'));
        }

        return $next($request);
    }
}
