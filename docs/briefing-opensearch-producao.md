# Briefing — OpenSearch em Produção

## 1. Variáveis de ambiente (`.env`)

```
OPENSEARCH_HOST=opensearch.exemplo.com
OPENSEARCH_PORT=9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=senha_segura
OPENSEARCH_SCHEME=https
OPENSEARCH_INDEX=products

NEXTJS_INTERNAL_URL=http://site:3000
REVALIDATE_TOKEN=token_aleatorio_seguro
```

| Variável | Padrão | Obrigatória | Descrição |
|---|---|---|---|
| `OPENSEARCH_HOST` | `localhost` | Sim | Hostname do cluster |
| `OPENSEARCH_PORT` | `9200` | Sim | Porta (9200 ou 443 via proxy) |
| `OPENSEARCH_USERNAME` | vazio | **Sim em produção** | Credencial do security plugin |
| `OPENSEARCH_PASSWORD` | vazio | **Sim em produção** | Credencial do security plugin |
| `OPENSEARCH_SCHEME` | `http` | **Trocar para `https`** | TLS obrigatório |
| `OPENSEARCH_INDEX` | `products` | Não | Nome do índice |
| `NEXTJS_INTERNAL_URL` | — | Sim | URL interna da instância Next.js para revalidação de cache. É o endereço do serviço na rede Docker (ex: `http://site:3000`). **Não é a URL pública** de uma loja — é o endpoint interno do próprio Next.js. |
| `REVALIDATE_TOKEN` | `alura-revalidate-secret` | Sim | Token compartilhado Laravel↔Next.js para autenticar chamadas de revalidação |

---

## 2. OpenSearch — opções de infraestrutura

| Abordagem | Complexidade | Custo |
|---|---|---|
| **AWS OpenSearch Service** (gerenciado) | Baixa | $$ |
| **Docker Compose multi-node** na VPS | Média | $ |
| **Single-node** na mesma VPS | Baixa | $ |

**AWS**: crie o domínio, pegue host/user/password e configure as env vars. TLS nativo.

**VPS própria**: siga a seção 3.

---

## 3. Docker Compose — ajustes para produção

O que **remover** da configuração atual:

- `DISABLE_SECURITY_PLUGIN=true` — **remover**, ativar security com TLS
- `DISABLE_INSTALL_DEMO_CONFIG=true` — remover
- `opensearch-dashboards` — não expor publicamente (remover do compose ou proteger com VPN)
- `ports: 9200:9200` — expor apenas na rede interna, não bindar no host

O que **ajustar**:

- `OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g` — mínimo 1 GB heap, ideal 2-4 GB
- `OPENSEARCH_INITIAL_ADMIN_PASSWORD` — senha inicial (OpenSearch ≥ 2.12)
- Pin da versão: `opensearchproject/opensearch:2.18.0` (nunca `latest`)
- Adicionar volume para certificados TLS

Exemplo de produção:

```yaml
opensearch:
  image: opensearchproject/opensearch:2.18.0
  environment:
    - discovery.type=single-node
    - bootstrap.memory_lock=true
    - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
    - OPENSEARCH_INITIAL_ADMIN_PASSWORD=${OPENSEARCH_PASSWORD}
  volumes:
    - opensearch_data:/usr/share/opensearch/data
  ulimits:
    memlock: { soft: -1, hard: -1 }
```

---

## 4. Segurança (TLS + Auth)

O `ProductSearchService` já tem suporte a autenticação (basta configurar as env vars):

```php
// config/opensearch.php → ProductSearchService.php
if ($config['username'] && $config['password']) {
    $builder->setBasicAuthentication($config['username'], $config['password']);
}
```

Para TLS: `OPENSEARCH_SCHEME=https` + certificado configurado no OpenSearch. Com AWS é nativo.

---

## 5. Criação do índice no deploy

O índice **não é criado automaticamente** no boot. Adicione ao pipeline de deploy:

```bash
php artisan opensearch:reindex-products
```

Ou apenas criar o índice vazio:

```bash
php artisan tinker --execute="app(App\Services\OpenSearch\ProductSearchService::class)->createIndex();"
```

Colocar após `php artisan migrate` no CI/CD.

---

## 6. Comportamento em caso de falha do OpenSearch

Analisando `ProductService::storeIndex()`:

| Cenário | Comportamento |
|---|---|
| `search` ausente, sem filtros OpenSearch | MySQL direto ✅ |
| `search` presente ou filtros OpenSearch | Tenta OpenSearch → **erro 500** se offline |

**Não há fallback automático.** Se o OpenSearch cair, qualquer busca retorna erro. Para tolerância a falhas seria necessário `try/catch` com fallback para MySQL.

---

## 7. Checklist de deploy

- [ ] Provisionar cluster OpenSearch (AWS ou VPS)
- [ ] Configurar `.env` com host, porta, usuário, senha, scheme
- [ ] `OPENSEARCH_SCHEME=https`
- [ ] Pin versão da imagem (`2.18.0`, não `latest`)
- [ ] `OPENSEARCH_JAVA_OPTS` mínimo 1 GB heap
- [ ] Remover `DISABLE_SECURITY_PLUGIN=true`
- [ ] Remover/proteger `opensearch-dashboards`
- [ ] Criar índice: `php artisan opensearch:reindex-products`
- [ ] `NEXTJS_INTERNAL_URL` com a URL interna do serviço Next.js
- [ ] `REVALIDATE_TOKEN` seguro (não o default)
- [ ] Horizon rodando para processar jobs de sync
- [ ] Testar busca, filtros, facets e autocomplete em staging
