<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug,NULL,id,tenant_id,' . tenant_id(),
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
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'variants' => 'array',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.barcode' => 'nullable|string|max:100',
            'variants.*.price' => 'nullable|numeric',
            'variants.*.weight' => 'nullable|numeric',
            'variants.*.height' => 'nullable|numeric',
            'variants.*.width' => 'nullable|numeric',
            'variants.*.length' => 'nullable|numeric',
            'variants.*.rank' => 'integer',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'integer|exists:medias,id',
        ];
    }
}
