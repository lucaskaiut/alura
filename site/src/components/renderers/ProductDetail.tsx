import ProductGallery from './ProductGallery';
import AddToCartButton from '@/components/cart/AddToCartButton';
import SafeHtml from '@/components/ui/SafeHtml';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

interface Product {
  id: number | string;
  name: string;
  price: string | number;
  sku?: string;
  short_desc?: string;
  full_desc?: string;
  media?: MediaItem[];
  images?: { url: string; alt: string }[];
  description?: string;
}

export default function ProductDetail({ product }: { product: Product }) {
  const price = typeof product.price === 'string'
    ? parseFloat(product.price)
    : product.price;

  const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery media={product.media ?? []} />

        <div>
          <h1 className="text-2xl font-bold text-text">{product.name}</h1>
          {product.sku && <p className="mt-1 text-sm text-text-muted">SKU: {product.sku}</p>}
          <p className="mt-4 text-3xl font-bold text-primary-600">
            R$ {price.toFixed(2).replace('.', ',')}
          </p>

          <div className="mt-6 p-4 rounded-lg border border-border bg-bg text-sm text-text-muted">
            Selecione as opções de frete e variações do produto.
          </div>

          <AddToCartButton productId={productId} />
        </div>
      </div>

      {(product.full_desc || product.short_desc || product.description) && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold text-text">Descrição</h2>
          <SafeHtml html={product.full_desc || product.short_desc || product.description || ''} className="prose prose-sm mt-3 max-w-none text-text-muted" />
        </div>
      )}
    </div>
  );
}
