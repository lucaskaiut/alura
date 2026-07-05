'use client';

import { useState, useMemo } from 'react';
import ProductGallery from './ProductGallery';
import AddToCartButton from '@/components/cart/AddToCartButton';
import SafeHtml from '@/components/ui/SafeHtml';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

interface AttributeValue {
  id: number;
  value: string;
  attribute?: { id: number; name: string; position?: number };
}

interface Variant {
  id: number;
  sku?: string;
  price?: string;
  stock?: number;
  attribute_values?: AttributeValue[];
  media?: MediaItem[];
}

interface Product {
  id: number | string;
  name: string;
  price: string | number;
  stock?: number;
  is_variable?: boolean;
  sku?: string;
  short_desc?: string;
  full_desc?: string;
  media?: MediaItem[];
  variants?: Variant[];
}

interface AttributeGroup {
  attributeId: number;
  name: string;
  position: number;
  values: AttributeValue[];
}

export default function ProductDetail({ product }: { product: Product }) {
  const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
  const isVariable = product.is_variable ?? false;

  // Group variant attribute values by attribute
  const attributeGroups = useMemo<AttributeGroup[]>(() => {
    if (!isVariable || !product.variants?.length) return [];

    const groups = new Map<number, AttributeGroup>();
    for (const variant of product.variants) {
      for (const av of variant.attribute_values || []) {
        const attr = av.attribute || { id: 0, name: '' };
        if (!groups.has(attr.id)) {
          groups.set(attr.id, { attributeId: attr.id, name: attr.name || 'Opção', position: attr.position ?? 0, values: [] });
        }
        const group = groups.get(attr.id)!;
        if (!group.values.find((v) => v.id === av.id)) {
          group.values.push(av);
        }
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.position - b.position);
  }, [isVariable, product.variants]);

  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});

  // Find matching variant
  const selectedVariant = useMemo<Variant | null>(() => {
    if (!isVariable || !product.variants?.length) return null;

    const selectedIds = Object.values(selectedValues);
    if (selectedIds.length !== attributeGroups.length) return null;

    return product.variants.find((v) => {
      const variantValueIds = (v.attribute_values || []).map((av) => av.id);
      return (
        variantValueIds.length === selectedIds.length &&
        selectedIds.every((id) => variantValueIds.includes(id))
      );
    }) || null;
  }, [isVariable, product.variants, selectedValues, attributeGroups.length]);

  // Compute available values for each attribute given current selections
  const availableValueIds = useMemo(() => {
    const sets = new Map<number, Set<number>>();
    if (!product.variants) return sets;

    for (const group of attributeGroups) {
      sets.set(group.attributeId, new Set<number>());
    }

    for (const v of product.variants) {
      const isInStock = (v.stock ?? 0) > 0;
      if (!isInStock) continue;

      const vValueIds = (v.attribute_values || []).map((av) => av.id);
      let matches = true;
      for (const [attrId, valId] of Object.entries(selectedValues)) {
        const numAttrId = Number(attrId);
        if (vValueIds.includes(valId)) continue;
        matches = false;
        break;
      }
      if (!matches) continue;

      for (const av of v.attribute_values || []) {
        const attr = av.attribute || { id: 0 };
        const set = sets.get(attr.id);
        if (set) set.add(av.id);
      }
    }

    return sets;
  }, [product.variants, attributeGroups, selectedValues]);

  const displayPrice = selectedVariant?.price ?? product.price;
  const displaySku = selectedVariant?.sku ?? product.sku;
  const displayMedia = (selectedVariant?.media?.length ? selectedVariant.media : product.media) ?? [];
  const price = typeof displayPrice === 'string'
    ? parseFloat(displayPrice)
    : (displayPrice as number);

  const handleSelect = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => {
      const next = { ...prev };
      if (next[attributeId] === valueId) {
        delete next[attributeId];
      } else {
        next[attributeId] = valueId;
      }
      return next;
    });
  };

  const allAttributesSelected = attributeGroups.length === 0 ||
    Object.keys(selectedValues).length === attributeGroups.length;

  const isSelectedVariantInStock = selectedVariant
    ? (selectedVariant.stock ?? 0) > 0
    : true;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery media={displayMedia} />

        <div>
          <h1 className="text-2xl font-bold text-text">{product.name}</h1>
          {displaySku && (
            <p className="mt-1 text-sm text-text-muted">SKU: {displaySku}</p>
          )}
          <p className="mt-4 text-3xl font-bold text-primary-600">
            {price != null && !isNaN(price)
              ? `R$ ${price.toFixed(2).replace('.', ',')}`
              : isVariable ? 'Selecione as opções' : 'Preço indisponível'}
          </p>

          {/* Variant selectors */}
          {isVariable && attributeGroups.length > 0 && (
            <div className="mt-6 space-y-4">
              {attributeGroups.map((group) => {
                const availableSet = availableValueIds.get(group.attributeId);
                return (
                  <div key={group.attributeId}>
                    <label className="block text-sm font-medium text-text mb-2">
                      {group.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map((av) => {
                        const isSelected = selectedValues[group.attributeId] === av.id;
                        const isAvailable = availableSet ? availableSet.has(av.id) : true;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => handleSelect(group.attributeId, av.id)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              !isAvailable
                                ? 'border-border bg-bg text-text-muted opacity-50'
                                : isSelected
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-border bg-surface text-text hover:border-primary-300'
                            }`}
                          >
                            {av.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isVariable && (
            <div className="mt-6 p-4 rounded-lg border border-border bg-bg text-sm text-text-muted">
              Selecione as opções de frete e variações do produto.
            </div>
          )}

          {selectedVariant && !isSelectedVariantInStock && (
            <p className="mt-3 text-sm text-danger-500">Esta combinação está sem estoque.</p>
          )}

          <AddToCartButton
            productId={productId}
            variantId={isVariable ? (selectedVariant?.id ?? null) : null}
            disabled={isVariable && (!allAttributesSelected || !isSelectedVariantInStock)}
          />
        </div>
      </div>

      {(product.full_desc || product.short_desc) && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold text-text">Descrição</h2>
          <SafeHtml
            html={product.full_desc || product.short_desc || ''}
            className="prose prose-sm mt-3 max-w-none text-text-muted"
          />
        </div>
      )}
    </div>
  );
}
