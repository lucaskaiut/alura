<?php

namespace App\Core\Payment;

use App\Core\Payment\Contracts\PaymentGateway;
use App\Core\Payment\DTOs\PaymentRequest;
use App\Core\Payment\DTOs\PaymentResponse;

class PaymentCore
{
    protected array $gateways = [];

    public function register(PaymentGateway $gateway): void
    {
        $this->gateways[$gateway->name()] = $gateway;
    }

    public function charge(PaymentRequest $request): PaymentResponse
    {
        $gateway = $this->gateways[$request->gateway] ?? null;

        if (! $gateway) {
            return new PaymentResponse(
                success: false,
                status: 'failed',
                transactionId: '',
                message: "Gateway '{$request->gateway}' not found",
            );
        }

        if (! in_array($request->method, $gateway->supportedMethods())) {
            return new PaymentResponse(
                success: false,
                status: 'failed',
                transactionId: '',
                message: "Method '{$request->method}' not supported by gateway '{$request->gateway}'",
            );
        }

        $result = $gateway->charge([
            'order_id' => $request->orderId,
            'method' => $request->method,
            'amount' => $request->amount,
            'customer' => $request->customer,
            'metadata' => $request->metadata,
        ]);

        return new PaymentResponse(
            success: $result['success'] ?? false,
            status: $result['status'] ?? 'pending',
            transactionId: $result['transaction_id'] ?? '',
            qrCode: $result['qr_code'] ?? null,
            boletoUrl: $result['boleto_url'] ?? null,
            redirectUrl: $result['redirect_url'] ?? null,
            metadata: $result['metadata'] ?? [],
            message: $result['message'] ?? null,
        );
    }

    public function refund(string $gatewayName, string $transactionId, float $amount): array
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if (! $gateway) {
            return ['success' => false, 'message' => "Gateway '{$gatewayName}' not found"];
        }

        return $gateway->refund($transactionId, $amount);
    }

    public function getStatus(string $gatewayName, string $transactionId): array
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if (! $gateway) {
            return ['success' => false, 'message' => "Gateway '{$gatewayName}' not found"];
        }

        return $gateway->getStatus($transactionId);
    }
}
