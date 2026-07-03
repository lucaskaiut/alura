<?php

namespace App\Services\OpenSearch;

use App\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\DB;
use OpenSearch\ClientBuilder;

class ProductSearchService
{
    private \OpenSearch\Client $client;
    private string $index;

    public function __construct()
    {
        $config = config('opensearch');

        $builder = ClientBuilder::create()
            ->setHosts(["{$config['scheme']}://{$config['host']}:{$config['port']}"]);

        if ($config['username'] && $config['password']) {
            $builder->setBasicAuthentication($config['username'], $config['password']);
        }

        $this->client = $builder->build();
        $this->index = $config['index'];
    }

    public function createIndex(): array
    {
        if ($this->client->indices()->exists(['index' => $this->index])) {
            return ['already_exists' => true];
        }

        return $this->client->indices()->create([
            'index' => $this->index,
            'body' => [
                'settings' => [
                    'number_of_shards' => 1,
                    'number_of_replicas' => 0,
                    'analysis' => [
                        'filter' => [
                            'portuguese_stop' => [
                                'type' => 'stop',
                                'stopwords' => '_portuguese_',
                            ],
                            'portuguese_stemmer' => [
                                'type' => 'stemmer',
                                'language' => 'portuguese',
                            ],
                            'edge_ngram_filter' => [
                                'type' => 'edge_ngram',
                                'min_gram' => 2,
                                'max_gram' => 20,
                            ],
                        ],
                        'analyzer' => [
                            'portuguese' => [
                                'type' => 'custom',
                                'tokenizer' => 'standard',
                                'filter' => ['lowercase', 'portuguese_stop', 'portuguese_stemmer'],
                            ],
                            'autocomplete_analyzer' => [
                                'type' => 'custom',
                                'tokenizer' => 'standard',
                                'filter' => ['lowercase', 'edge_ngram_filter'],
                            ],
                            'search_analyzer' => [
                                'type' => 'custom',
                                'tokenizer' => 'standard',
                                'filter' => ['lowercase'],
                            ],
                        ],
                    ],
                ],
                'mappings' => [
                    'properties' => [
                        'tenant_id' => ['type' => 'integer'],
                        'product_id' => ['type' => 'integer'],
                        'name' => [
                            'type' => 'text',
                            'analyzer' => 'portuguese',
                            'search_analyzer' => 'search_analyzer',
                            'fields' => [
                                'keyword' => ['type' => 'keyword'],
                                'autocomplete' => [
                                    'type' => 'text',
                                    'analyzer' => 'autocomplete_analyzer',
                                    'search_analyzer' => 'search_analyzer',
                                ],
                            ],
                        ],
                        'slug' => ['type' => 'keyword'],
                        'brand_id' => ['type' => 'integer'],
                        'brand_name' => [
                            'type' => 'text',
                            'analyzer' => 'portuguese',
                            'fields' => ['keyword' => ['type' => 'keyword']],
                        ],
                        'category_id' => ['type' => 'integer'],
                        'category_name' => [
                            'type' => 'text',
                            'analyzer' => 'portuguese',
                            'fields' => ['keyword' => ['type' => 'keyword']],
                        ],
                        'price_min' => ['type' => 'float'],
                        'price_max' => ['type' => 'float'],
                        'status' => ['type' => 'boolean'],
                        'stock_available' => ['type' => 'boolean'],
                        'created_at' => ['type' => 'date'],
                    ],
                ],
            ],
        ]);
    }

    public function deleteIndex(): array
    {
        if (!$this->client->indices()->exists(['index' => $this->index])) {
            return ['not_found' => true];
        }

        return $this->client->indices()->delete(['index' => $this->index]);
    }

    public function indexProduct(int $productId): void
    {
        $productData = $this->buildDocument($productId);

        if (!$productData) {
            return;
        }

        $this->client->index([
            'index' => $this->index,
            'id' => (string) $productId,
            'body' => $productData,
        ]);
    }

    public function deleteProduct(int $productId): void
    {
        try {
            $this->client->delete([
                'index' => $this->index,
                'id' => (string) $productId,
            ]);
        } catch (\Exception $e) {
            if (!str_contains($e->getMessage(), 'not_found')) {
                throw $e;
            }
        }
    }

    public function syncProduct(int $productId, string $action): void
    {
        if ($action === 'delete') {
            $this->deleteProduct($productId);
        } else {
            $this->indexProduct($productId);
        }
    }

    private function buildDocument(int $productId): ?array
    {
        $product = \App\Models\Product::withoutGlobalScope(TenantScope::class)
            ->with(['stock'])
            ->find($productId);

        if (!$product) {
            return null;
        }

        $brandName = null;
        if ($product->brand_id) {
            $brandName = DB::table('brands')->where('id', $product->brand_id)->value('name');
        }

        $categoryName = null;
        if ($product->category_id) {
            $categoryName = DB::table('categories')->where('id', $product->category_id)->value('name');
        }

        $priceMin = $product->price;
        $priceMax = $product->price;

        if ($product->is_variable && $product->variants()->exists()) {
            $variants = $product->variants;
            $prices = $variants->pluck('price')->filter(fn($p) => !is_null($p));
            if ($prices->isNotEmpty()) {
                $priceMin = (float) $prices->min();
                $priceMax = (float) $prices->max();
            }
        }

        $stockAvailable = false;
        if ($product->stock()->exists()) {
            $stockAvailable = $product->stock()->sum('quantity') > 0;
        } elseif ($product->variants()->exists() && $product->variants()->has('stock')->exists()) {
            foreach ($product->variants as $variant) {
                if ($variant->stock()->sum('quantity') > 0) {
                    $stockAvailable = true;
                    break;
                }
            }
        }

        return [
            'tenant_id' => $product->tenant_id,
            'product_id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'brand_id' => $product->brand_id,
            'brand_name' => $brandName,
            'category_id' => $product->category_id,
            'category_name' => $categoryName,
            'price_min' => $priceMin ? (float) $priceMin : 0,
            'price_max' => $priceMax ? (float) $priceMax : 0,
            'status' => (bool) $product->status,
            'stock_available' => $stockAvailable,
            'created_at' => $product->created_at?->toIso8601String(),
        ];
    }

    public function search(array $params): array
    {
        $tenantId = tenant_id();
        if (!$tenantId) {
            throw new \RuntimeException('Tenant ID is required for search.');
        }

        $query = $params['search'] ?? '';
        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? 20)));
        $from = ($page - 1) * $perPage;

        $body = [
            'from' => $from,
            'size' => $perPage,
            'query' => [
                'bool' => [
                    'filter' => [
                        ['term' => ['tenant_id' => $tenantId]],
                        ['term' => ['status' => true]],
                    ],
                ],
            ],
            'sort' => [],
            'aggs' => [
                'categories' => [
                    'terms' => [
                        'field' => 'category_id',
                        'size' => 50,
                    ],
                    'aggs' => [
                        'category_name' => [
                            'terms' => ['field' => 'category_name.keyword', 'size' => 1],
                        ],
                    ],
                ],
                'brands' => [
                    'terms' => [
                        'field' => 'brand_id',
                        'size' => 50,
                    ],
                    'aggs' => [
                        'brand_name' => [
                            'terms' => ['field' => 'brand_name.keyword', 'size' => 1],
                        ],
                    ],
                ],
                'price_ranges' => [
                    'range' => [
                        'field' => 'price_min',
                        'ranges' => [
                            ['key' => '0-100', 'from' => 0, 'to' => 100],
                            ['key' => '100-500', 'from' => 100, 'to' => 500],
                            ['key' => '500-1000', 'from' => 500, 'to' => 1000],
                            ['key' => '1000-5000', 'from' => 1000, 'to' => 5000],
                            ['key' => '5000-*', 'from' => 5000],
                        ],
                    ],
                ],
            ],
        ];

        if ($query) {
            $body['query']['bool']['must'] = [
                'multi_match' => [
                    'query' => $query,
                    'fields' => ['name^10', 'name.autocomplete^8', 'brand_name^6', 'category_name^3'],
                    'type' => 'best_fields',
                ],
            ];
        }

        $sort = $params['sort'] ?? 'relevance';
        switch ($sort) {
            case 'price_asc':
                $body['sort'][] = ['price_min' => ['order' => 'asc']];
                break;
            case 'price_desc':
                $body['sort'][] = ['price_min' => ['order' => 'desc']];
                break;
            case 'newest':
                $body['sort'][] = ['created_at' => ['order' => 'desc']];
                break;
            case 'name_asc':
                $body['sort'][] = ['name.keyword' => ['order' => 'asc']];
                break;
            case 'name_desc':
                $body['sort'][] = ['name.keyword' => ['order' => 'desc']];
                break;
            default:
                if ($query) {
                    $body['sort'][] = ['_score' => ['order' => 'desc']];
                }
                break;
        }

        if (empty($body['sort'])) {
            unset($body['sort']);
        }

        if (!empty($params['category_id'])) {
            $body['query']['bool']['filter'][] = ['term' => ['category_id' => (int) $params['category_id']]];
        }

        if (!empty($params['brand_id'])) {
            $body['query']['bool']['filter'][] = ['term' => ['brand_id' => (int) $params['brand_id']]];
        }

        if (!empty($params['price_min'])) {
            $body['query']['bool']['filter'][] = ['range' => ['price_min' => ['gte' => (float) $params['price_min']]]];
        }

        if (!empty($params['price_max'])) {
            $body['query']['bool']['filter'][] = ['range' => ['price_max' => ['lte' => (float) $params['price_max']]]];
        }

        if (!empty($params['in_stock'])) {
            $body['query']['bool']['filter'][] = ['term' => ['stock_available' => true]];
        }

        $response = $this->client->search([
            'index' => $this->index,
            'body' => $body,
        ]);

        return $this->formatResponse($response, $page, $perPage);
    }

    public function suggest(string $query, int $limit = 10): array
    {
        $tenantId = tenant_id();
        if (!$tenantId) {
            return [];
        }

        $response = $this->client->search([
            'index' => $this->index,
            'body' => [
                'query' => [
                    'bool' => [
                        'filter' => [
                            ['term' => ['tenant_id' => $tenantId]],
                            ['term' => ['status' => true]],
                        ],
                        'must' => [
                            'multi_match' => [
                                'query' => $query,
                                'fields' => ['name.autocomplete', 'brand_name', 'category_name'],
                                'type' => 'best_fields',
                            ],
                        ],
                    ],
                ],
                'size' => $limit,
                '_source' => ['name'],
            ],
        ]);

        return array_map(
            fn($hit) => $hit['_source']['name'],
            $response['hits']['hits']
        );
    }

    private function formatResponse(array $response, int $page, int $perPage): array
    {
        $total = $response['hits']['total']['value'] ?? 0;
        $ids = array_map(
            fn($hit) => (int) $hit['_id'],
            $response['hits']['hits']
        );

        $facets = [
            'categories' => [],
            'brands' => [],
            'price_ranges' => [],
        ];

        if (isset($response['aggregations'])) {
            if (isset($response['aggregations']['categories']['buckets'])) {
                foreach ($response['aggregations']['categories']['buckets'] as $bucket) {
                    $name = $bucket['category_name']['buckets'][0]['key'] ?? '';
                    $facets['categories'][] = [
                        'id' => $bucket['key'],
                        'name' => $name,
                        'count' => $bucket['doc_count'],
                    ];
                }
            }

            if (isset($response['aggregations']['brands']['buckets'])) {
                foreach ($response['aggregations']['brands']['buckets'] as $bucket) {
                    $name = $bucket['brand_name']['buckets'][0]['key'] ?? '';
                    $facets['brands'][] = [
                        'id' => $bucket['key'],
                        'name' => $name,
                        'count' => $bucket['doc_count'],
                    ];
                }
            }

            if (isset($response['aggregations']['price_ranges']['buckets'])) {
                $labels = [
                    '0-100' => 'Até R$ 100',
                    '100-500' => 'R$ 100 a R$ 500',
                    '500-1000' => 'R$ 500 a R$ 1.000',
                    '1000-5000' => 'R$ 1.000 a R$ 5.000',
                    '5000-*' => 'Acima de R$ 5.000',
                ];
                foreach ($response['aggregations']['price_ranges']['buckets'] as $bucket) {
                    $facets['price_ranges'][] = [
                        'key' => $bucket['key'],
                        'label' => $labels[$bucket['key']] ?? $bucket['key'],
                        'count' => $bucket['doc_count'],
                    ];
                }
            }
        }

        return [
            'ids' => $ids,
            'total' => $total,
            'current_page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'facets' => $facets,
        ];
    }
}
