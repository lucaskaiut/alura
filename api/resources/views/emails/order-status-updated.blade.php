<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="padding: 24px 28px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="margin: 0; font-size: 18px; color: #111827;">
                @php $storeName = tenant()?->trade_name ?? tenant()?->name ?? config('app.name'); @endphp
                {{ $storeName }}
            </h1>
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
                O seu pedido <strong style="color: #111827;">#{{ $order->number }}</strong> foi atualizado para:
                <span style="display: inline-block; margin-left: 6px; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: {{ $order->status?->color ?? '#6b7280' }}; background: {{ ($order->status?->color ?? '#6b7280') . '15' }};">
                    {{ $order->status?->name ?? 'Atualizado' }}
                </span>
            </p>
        </div>

        <div style="padding: 24px 28px;">
            <h2 style="margin: 0 0 16px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Itens do pedido</h2>
            <table style="width: 100%; border-collapse: collapse;">
                @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0;">
                        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 500;">{{ $item->name_snapshot }}</p>
                        @if ($item->sku_snapshot)
                        <p style="margin: 2px 0 0; font-size: 12px; color: #9ca3af;">SKU: {{ $item->sku_snapshot }}</p>
                        @endif
                    </td>
                    <td style="padding: 10px 0; text-align: right; white-space: nowrap;">
                        <span style="font-size: 14px; color: #6b7280;">Qtd: {{ $item->quantity }}</span>
                        <span style="margin-left: 16px; font-size: 14px; color: #111827; font-weight: 500;">R$ {{ number_format($item->price * $item->quantity / 100, 2, ',', '.') }}</span>
                    </td>
                </tr>
                @endforeach
            </table>
        </div>

        <div style="padding: 16px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px;">
                <tr>
                    <td style="color: #6b7280; padding: 2px 0;">Subtotal</td>
                    <td style="text-align: right; color: #111827;">R$ {{ number_format((float) $order->subtotal, 2, ',', '.') }}</td>
                </tr>
                @if ((float) $order->discount > 0)
                <tr>
                    <td style="color: #6b7280; padding: 2px 0;">Desconto</td>
                    <td style="text-align: right; color: #ef4444;">-R$ {{ number_format((float) $order->discount, 2, ',', '.') }}</td>
                </tr>
                @endif
                <tr>
                    <td style="color: #6b7280; padding: 2px 0;">Frete</td>
                    <td style="text-align: right; color: #111827;">R$ {{ number_format((float) $order->shipping_cost, 2, ',', '.') }}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; color: #111827; padding: 6px 0 0;">Total</td>
                    <td style="text-align: right; font-weight: 700; color: #111827; font-size: 16px; padding: 6px 0 0;">R$ {{ number_format((float) $order->total, 2, ',', '.') }}</td>
                </tr>
            </table>
        </div>

        <div style="padding: 16px 28px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Este é um e-mail automático. Por favor, não responda.
            </p>
        </div>
    </div>
</body>
</html>
