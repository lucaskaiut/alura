<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Mail\Mailable;

class OrderStatusUpdated extends Mailable
{
    public function __construct(
        public Order $order,
    ) {}

    public function build(): self
    {
        $storeName = tenant()?->trade_name ?? tenant()?->name ?? config('app.name');
        $statusName = $this->order->status?->name ?? 'Atualizado';

        return $this->subject("O seu pedido em {$storeName} foi atualizado: {$statusName}")
            ->view('emails.order-status-updated');
    }
}
