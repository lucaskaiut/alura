'use client';

import ProductCard from '@/components/ui/ProductCard';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

interface Product {
  id: number | string;
  name: string;
  slug?: string;
  price: string | number;
  media?: MediaItem[];
  images?: { url: string; alt: string }[];
  image?: string;
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        return (
          <ProductCard
            key={product.id}
            id={Number(product.id)}
            name={product.name}
            slug={product.slug}
            price={price}
            media={product.media as MediaItem[]}
            image={product.images?.[0]?.url || product.image}
          />
        );
      })}
    </div>
  );
}
