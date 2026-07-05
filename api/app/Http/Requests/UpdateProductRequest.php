<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route('product');

        return [
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:products,slug,' . $product->id . ',id,tenant_id,' . tenant_id(),
            'short_desc' => 'nullable|string',
            'full_desc' => 'nullable|string',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
            'is_variable' => 'boolean',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'length' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'cost_price' => 'nullable|numeric',
            'stock' => 'nullable|integer',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'integer|exists:medias,id',
            'removed_media_ids' => 'nullable|array',
            'removed_media_ids.*' => 'integer',
            'primary_media_id' => 'nullable|integer',
            'variants' => 'array',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.barcode' => 'nullable|string|max:100',
            'variants.*.price' => 'nullable|numeric',
            'variants.*.stock' => 'nullable|integer',
            'variants.*.weight' => 'nullable|numeric',
            'variants.*.height' => 'nullable|numeric',
            'variants.*.width' => 'nullable|numeric',
            'variants.*.length' => 'nullable|numeric',
            'variants.*.rank' => 'integer',
            'variants.*.attribute_value_ids' => 'nullable|array',
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
            'variants.*.media_ids' => 'nullable|array',
            'variants.*.media_ids.*' => 'integer|exists:medias,id',
            'variants.*.removed_media_ids' => 'nullable|array',
            'variants.*.removed_media_ids.*' => 'integer',
            'removed_variant_ids' => 'nullable|array',
            'removed_variant_ids.*' => 'integer|exists:product_variants,id',
        ];
    }
}
