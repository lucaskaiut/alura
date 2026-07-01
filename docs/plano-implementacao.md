# Plano de Implementação — Alura

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
3. [Padrões de Código](#3-padrões-de-código)
4. [Etapa 1 — Fundação Multi-Tenant e Setup Inicial](#etapa-1--fundação-multi-tenant-e-setup-inicial)
5. [Etapa 2 — Gestão de Empresas e Configurações de Loja](#etapa-2--gestão-de-empresas-e-configurações-de-loja)
6. [Etapa 3 — Usuários Administrativos e Perfis de Acesso (ACL)](#etapa-3--usuários-administrativos-e-perfis-de-acesso-acl)
7. [Etapa 4 — Catálogo: Categorias e Marcas](#etapa-4--catálogo-categorias-e-marcas)
8. [Etapa 5 — Catálogo: Atributos, Produtos Simples e Variáveis](#etapa-5--catálogo-atributos-produtos-simples-e-variáveis)
9. [Etapa 6 — Controle de Estoque](#etapa-6--controle-de-estoque)
10. [Etapa 7 — Gestão de Clientes e Endereços](#etapa-7--gestão-de-clientes-e-endereços)
11. [Etapa 8 — Carrinho de Compras e Checkout](#etapa-8--carrinho-de-compras-e-checkout)
12. [Etapa 9 — Módulo de Frete (Core + Gateways)](#etapa-9--módulo-de-frete-core--gateways)
13. [Etapa 10 — Módulo de Pagamento (Core + Gateways)](#etapa-10--módulo-de-pagamento-core--gateways)
14. [Etapa 11 — Gestão de Pedidos, Status e Timeline](#etapa-11--gestão-de-pedidos-status-e-timeline)
15. [Etapa 12 — Cupons de Desconto](#etapa-12--cupons-de-desconto)
16. [Etapa 13 — Sistema de Router e Resolução de URLs](#etapa-13--sistema-de-router-e-resolução-de-urls)
17. [Etapa 14 — CMS, Páginas e SEO](#etapa-14--cms-páginas-e-seo)
18. [Etapa 15 — Editor Visual (CraftJS) e Home da Loja](#etapa-15--editor-visual-craftjs-e-home-da-loja)
19. [Etapa 16 — Busca de Produtos](#etapa-16--busca-de-produtos)
20. [Etapa 17 — Dashboard e Relatórios](#etapa-17--dashboard-e-relatórios)
21. [Etapa 18 — Templates de E-mail e Eventos](#etapa-18--templates-de-e-mail-e-eventos)
22. [Etapa 19 — LGPD: Consentimento e Anonimização](#etapa-19--lgpd-consentimento-e-anonimização)
23. [Etapa 20 — Frontend da Loja (Next.js)](#etapa-20--frontend-da-loja-nextjs)
24. [Etapa 21 — Integração Final e Testes End-to-End](#etapa-21--integração-final-e-testes-end-to-end)

---

## 1. Visão Geral da Arquitetura

### 1.1 Diagrama Conceitual

```
┌──────────────────────────────────────────────────────────────┐
│                     Cliente (Navegador)                       │
└───────┬──────────────────────────────────┬───────────────────┘
        │                                  │
        ▼                                  ▼
┌───────────────┐                 ┌─────────────────┐
│  Loja (Next)  │                 │  Admin (React)  │
│  SSR / SSG    │                 │  SPA + TanStack │
│  [...slug]    │                 │  Query          │
│  via Router   │                 │                 │
└───────┬───────┘                 └────────┬────────┘
        │                                  │
        └──────────────┬───────────────────┘
                       │ HTTP/JSON
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Laravel 13 API                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │Tenant    │  │Payment   │  │Shipping  │  │Router        │ │
│  │Middleware│  │Core+GW   │  │Core+GW   │  │+ Resolvers   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  CMS / Builder / Pages / Categories / Products           ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │MySQL 8.4│  │  Redis   │  │Filestore │
   │(Tenant) │  │Cache/Q   │  │(Images)  │
   └─────────┘  └──────────┘  └──────────┘
```

### 1.2 Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Multi-tenant | Shared DB + tenant_id | Menor custo operacional; escopo via global scope do Eloquent |
| Autenticação | Laravel Sanctum (SPA) | API tokens para SPA; suporte a SESSION para Next.js server-side |
| API | REST + JSON:API-like | Padronização de respostas, includes, paginação |
| Frontend Admin | React + Vite + TanStack Query | Reatividade, cache declarativo, refetch automático |
| Frontend Loja | Next.js 16+ App Router | SSR/SSG essencial para SEO; consumo da API via fetch |
| Router de URLs | Resolvers plugáveis ordenados por prioridade | API decide se slug é produto, categoria ou página; Next.js usa catch-all [...slug] |
| Filas | Laravel Horizon + Redis | Emails, webhooks, conciliação, relatórios pesados |
| Pagamento/Frete | Core abstrato + Gateways | Desacoplamento total; troca de gateway sem alterar regra de negócio |
| Cache | Redis (tags por tenant) | Invalidação seletiva por tenant e por recurso |
| Logs | Monolog + canal Stackdriver | Agregação por tenant_id em todas as entradas |

### 1.3 Modelo de Dados Multi-Tenant

**Estratégia:** Shared Database com coluna `tenant_id` em TODAS as tabelas de domínio.

```sql
-- Exemplo de migration tenant-aware
CREATE TABLE categories (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL,
    parent_id   BIGINT UNSIGNED NULL,
    status      TINYINT NOT NULL DEFAULT 1,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,

    UNIQUE KEY uq_tenant_slug (tenant_id, slug),
    INDEX idx_tenant (tenant_id),
    FOREIGN KEY (parent_id) REFERENCES categories(id)
        ON DELETE SET NULL
);
```

**Tabelas globais (sem tenant_id):**
- `tenants` — Empresas cadastradas
- `tenant_user` — Pivot users <-> tenants
- `migrations`, `failed_jobs`, `sessions`

**Todas as demais tabelas levam `tenant_id`.**

---

## 2. Estrutura de Diretórios

```
alura/
├── api/                             # Laravel 13 API
│   ├── app/
│   │   ├── Console/Commands/
│   │   ├── Core/                    # Núcleos abstratos
│   │   │   ├── Payment/
│   │   │   │   ├── PaymentCore.php
│   │   │   │   ├── Contracts/
│   │   │   │   │   └── PaymentGateway.php
│   │   │   │   ├── DTOs/
│   │   │   │   │   ├── PaymentRequest.php
│   │   │   │   │   └── PaymentResponse.php
│   │   │   │   └── WebhookHandler.php
│   │   │   ├── Shipping/
│   │   │   │   ├── ShippingCore.php
│   │   │   │   ├── Contracts/
│   │   │   │   │   └── ShippingGateway.php
│   │   │   │   ├── DTOs/
│   │   │   │   │   ├── ShippingRequest.php
│   │   │   │   │   └── ShippingOption.php
│   │   │   │   └── LabelGenerator.php
│   │   │   ├── Router/
│   │   │   │   ├── RouterService.php
│   │   │   │   ├── Contracts/
│   │   │   │   │   └── RouterResolver.php
│   │   │   │   ├── DTOs/
│   │   │   │   │   └── RouteMatch.php
│   │   │   │   └── Resolvers/
│   │   │   │       ├── ProductResolver.php
│   │   │   │       ├── CategoryResolver.php
│   │   │   │       ├── PageResolver.php
│   │   │   │       └── DefaultResolver.php
│   │   │   └── PageBuilder/
│   │   ├── Gateways/
│   │   │   ├── Payment/
│   │   │   │   ├── PixGateway.php
│   │   │   │   ├── CreditCardGateway.php
│   │   │   │   └── BoletoGateway.php
│   │   │   └── Shipping/
│   │   │       ├── FixedShippingGateway.php
│   │   │       ├── CorreiosGateway.php
│   │   │       └── JadlogGateway.php
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   └── RouterController.php
│   │   │   ├── Middleware/
│   │   │   │   ├── IdentifyTenant.php
│   │   │   │   └── EnforceTenantScope.php
│   │   │   └── Resources/
│   │   ├── Models/
│   │   │   ├── Tenant.php
│   │   │   ├── Traits/
│   │   │   │   └── BelongsToTenant.php
│   │   │   ├── Category.php
│   │   │   ├── Product.php
│   │   │   └── ... (todos com trait BelongsToTenant)
│   │   ├── Services/
│   │   │   ├── TenantScopeService.php
│   │   │   ├── CartService.php
│   │   │   ├── CheckoutService.php
│   │   │   └── OrderService.php
│   │   └── Observers/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php
│   │   └── webhooks.php
│   ├── tests/
│   │   ├── Unit/
│   │   └── Feature/
│   └── phpunit.xml
│
├── admin/                            # React SPA (Painel Admin)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── hooks/
│   │   │   ├── useTenant.ts
│   │   │   ├── useProducts.ts
│   │   │   └── ... (query hooks)
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios/Fetch wrapper
│   │   │   └── queryClient.ts
│   │   └── stores/
│   ├── vitest.config.ts
│   └── package.json
│
├── site/                             # Next.js (Loja)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Home (consulta Router API)
│   │   │   ├── carrinho/
│   │   │   │   └── page.tsx         # Carrinho (Client Component)
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx         # Checkout (Client Component)
│   │   │   ├── busca/
│   │   │   │   └── page.tsx         # Resultados de busca
│   │   │   └── [...slug]/           # Catch-all: produtos, categorias, páginas CMS
│   │   │       └── page.tsx         # Consulta Router API e renderiza o tipo correto
│   │   ├── components/
│   │   │   ├── renderers/           # Renderizadores por tipo de rota
│   │   │   │   ├── ProductRenderer.tsx
│   │   │   │   ├── CategoryRenderer.tsx
│   │   │   │   ├── PageRenderer.tsx
│   │   │   │   └── SearchRenderer.tsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── router.ts            # fetch para /api/router/resolve
│   │   └── types/
│   ├── vitest.config.ts
│   └── package.json
│
└── docs/
    ├── requisitos.md
    └── plano-implementacao.md        # Este documento
```

---

## 3. Padrões de Código

### 3.1 Backend (Laravel 13)

#### Trait BelongsToTenant

TODOS os models de domínio DEVEM usar esta trait. Ela registra automaticamente o global scope e o evento `creating` para atribuir `tenant_id`.

```php
// app/Models/Traits/BelongsToTenant.php
namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (is_null($model->tenant_id)) {
                $model->tenant_id = tenant_id();
            }
        });
    }

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

#### API Resource padronizado

Toda resposta da API deve seguir envelope:

```json
{
  "data": { },
  "meta": { "current_page": 1, "last_page": 5, "total": 50 }
}
```

#### Form Request Validation

TODA requisição deve passar por um FormRequest dedicado com `authorize()` verificado contra o perfil do usuário.

#### Service Layer

Regras de negócio NUNCA em controllers. Sempre em Services injetáveis:

```php
class CheckoutService
{
    public function __construct(
        private CartService $cart,
        private ShippingCore $shipping,
        private PaymentCore $payment,
    ) {}

    public function execute(CheckoutRequest $request): Order {}
}
```

#### Testes

- **Unitários**: PHPUnit, testam Services, DTOs, Gateways isolados com mocks
- **Feature**: Testam endpoints HTTP completos com RefreshDatabase
- Cobertura mínima exigida por etapa: 80% nas classes criadas/modificadas

### 3.2 Admin (React + TanStack Query)

- `useQuery` / `useMutation` encapsulados em hooks customizados por recurso
- Query keys sempre prefixadas com `tenantId`
- Formulários com React Hook Form + Zod validation
- Componentes de UI: shadcn/ui (Radix + Tailwind)

### 3.3 Store (Next.js)

- `App Router` com Server Components sempre que possível
- Client Components apenas para interatividade (carrinho, checkout)
- Fetch da API com tags de cache e revalidação

---

## Etapa 1 — Fundação Multi-Tenant e Setup Inicial

**Duração estimada:** 3 dias
**RF atendidos:** Infraestrutura base

### 1.1 Arquitetura

```
Requisição HTTP
  │
  ▼
IdentifyTenant (middleware)
  │ extrai domain/subdomain
  │ busca Tenant no Redis ou DB
  │ lança TenantNotFoundException se não encontrado
  ▼
EnforceTenantScope (middleware)
  │ injeta tenant_id no Service Container
  │ ativa global scope nos models
  ▼
Controller
  │ todo Model::create() já recebe tenant_id automático
  ▼
Response
```

### 1.2 Tarefas

| # | Tarefa | Descrição |
|---|---|---|
| 1.1 | Criar projeto Laravel 13 | `composer create-project laravel/laravel api` |
| 1.2 | Configurar MySQL 8.4 + Redis | `.env` com conexões; `database.php` com charset utf8mb4 |
| 1.3 | Instalar Laravel Sanctum | Autenticação SPA |
| 1.4 | Migration `tenants` | id, name, slug, database_name, domain, subdomain, status, timestamps |
| 1.5 | Model `Tenant` + `TenantScope` | Scope global que adiciona `where('tenant_id', tenant_id())` a todas as queries |
| 1.6 | Trait `BelongsToTenant` | Auto-atribuição de tenant_id no creating |
| 1.7 | Middleware `IdentifyTenant` | Resolve tenant por subdomínio (ex: `loja1.alura.local`) ou domínio customizado |
| 1.8 | Middleware `EnforceTenantScope` | Seta `tenant_id()` no container; aborta 404 se não identificado |
| 1.9 | Helper `tenant_id()` | Função global que retorna o ID do tenant atual do container |
| 1.10 | API Resource base `BaseJsonResource` | Envelope padronizado `{data, meta}` |
| 1.11 | Handler de erros tenant-aware | `TenantNotFoundException` com status 404 |
| 1.12 | Criar projeto Next.js | `npx create-next-app@latest site` |
| 1.13 | Criar projeto React Admin | `npm create vite@latest admin -- --template react-ts` |
| 1.14 | Configurar TanStack Query no Admin | `QueryClientProvider` no root; devtools em dev |
| 1.15 | Configurar Axios no Admin | Base URL dinâmica por tenant; interceptor para token Sanctum |
| 1.16 | Docker Compose | Serviços: `app`, `mysql`, `redis`, `queue` (Horizon) |

### 1.3 Testes Obrigatórios

| Teste | Tipo | O que valida |
|---|---|---|
| `TenantScopeTest` | Unit | Global scope adiciona `where tenant_id = X` corretamente |
| `IdentifyTenantTest` | Feature | Subdomínio resolve tenant; domínio customizado resolve |
| `IdentifyTenantTest::testUnknownTenantReturns404` | Feature | Domínio não cadastrado retorna 404 |
| `BelongsToTenantTest` | Unit | Model criado recebe tenant_id automaticamente |
| `TenantIsolationTest` | Feature | Dados de tenant A não vazam para tenant B |

### 1.4 Critérios de Validação

- [ ] `php artisan test --filter=Tenant` — todos verdes
- [ ] Requisição para `http://tenant1.alura.test/api/ping` retorna 200 com tenant_id no log
- [ ] Requisição para `http://unknown.alura.test/api/ping` retorna 404
- [ ] `docker compose up` sobe todos os 4 serviços sem erro

---

## Etapa 2 — Gestão de Empresas e Configurações de Loja

**Duração estimada:** 2 dias
**RF atendidos:** RF001, RF002

### 2.1 Tarefas

| # | Tarefa |
|---|---|
| 2.1 | Migration `tenants` — adicionar colunas: `legal_name`, `trade_name`, `fiscal_document`, `email`, `phone`, `address_*`, `logo_path` |
| 2.2 | Migration `tenant_settings` — chave/valor com type casting (JSON) para configurações da loja |
| 2.3 | `TenantController` — CRUD com `FormRequest` para criação |
| 2.4 | `TenantSettingsController` — GET/PUT para settings |
| 2.5 | `TenantService` — lógica de criação (gera slug do subdomínio, valida unicidade) |
| 2.6 | `TenantResource` — API resource para resposta padronizada |
| 2.7 | Seeder `TenantSeeder` — cria tenant demo para desenvolvimento |
| 2.8 | Admin: Página de cadastro/edição de empresa |
| 2.9 | Admin: Página de configurações da loja (logo, favicon, redes sociais, políticas) |

### 2.2 Testes

| Teste | O que valida |
|---|---|
| `TenantServiceTest` | Criação com dados válidos; falha com domínio duplicado |
| `TenantControllerTest` | POST/PUT/GET retornam status corretos e estrutura JSON |
| `TenantSettingsTest` | PUT persiste; GET retorna chaves corretas |
| `CreateTenantTest` (Feature) | Ciclo completo: request -> persistência -> resource |

### 2.3 Critérios de Validação

- [ ] `php artisan test --filter=Tenant` — todos verdes
- [ ] Criar empresa via `POST /api/tenants` e visualizar em `GET /api/tenants/{id}`
- [ ] Atualizar settings via `PUT /api/tenants/{id}/settings` e verificar persistência

---

## Etapa 3 — Usuários Administrativos e Perfis de Acesso (ACL)

**Duração estimada:** 3 dias
**RF atendidos:** RF003, RF004

### 3.1 Arquitetura

```
User  ──┬── Role (Admin | Manager | Operator)
        │
        └── Permissions (polymorphic: modules)
             ├── products.read
             ├── products.write
             ├── orders.read
             └── ...
```

- Model `User` pertence a um `Tenant` via tabela pivot `tenant_user`
- Model `Role` com permissões em JSON (ex: `{"products": ["read","write"], "orders": ["read"]}`)
- Middleware de autorização verifica `$user->can('products.write')` no tenant atual

### 3.2 Tarefas

| # | Tarefa |
|---|---|
| 3.1 | Migration `users` (adicionar `tenant_user` pivot, `status`, `role_id`) |
| 3.2 | Migration `roles` — id, tenant_id, name, permissions (JSON), timestamps |
| 3.3 | Model `User` com relação `tenant`, `role` |
| 3.4 | Model `Role` com cast `permissions` para array |
| 3.5 | `AuthController` — login/logout/me usando Sanctum (cookie-based SPA) |
| 3.6 | `UserController` — CRUD de usuários dentro do tenant |
| 3.7 | `RoleController` — CRUD de perfis |
| 3.8 | Trait `HasTenantPermissions` — método `can(string $ability): bool` que lê `$user->role->permissions` |
| 3.9 | Middleware `AuthorizeModule` — verifica permissão no módulo; usado em rotas agrupadas |
| 3.10 | Admin: Tela de login |
| 3.11 | Admin: CRUD de usuários |
| 3.12 | Admin: CRUD de perfis (com checkboxes por módulo) |

### 3.3 Testes

| Teste | O que valida |
|---|---|
| `AuthControllerTest` | Login retorna 200 com cookie; credenciais inválidas 401; logout limpa sessão |
| `UserControllerTest` | CRUD com validação de email único dentro do tenant |
| `RoleControllerTest` | CRUD; permissões persistidas como JSON |
| `HasTenantPermissionsTest` | `can('products.write')` retorna true/false conforme role |
| `AuthorizeModuleTest` | Usuário sem permissão recebe 403 |
| `TenantUserIsolationTest` | Usuário do tenant A não autentica no tenant B |

### 3.4 Critérios de Validação

- [ ] `php artisan test --filter="Auth|User|Role|Permission"` — todos verdes
- [ ] Login admin funcional no SPA
- [ ] Criar perfil "Operador" com acesso apenas a pedidos; logar e verificar 403 em produtos
- [ ] Fluxo completo: cria role -> cria user -> login -> acessa recurso autorizado

---

## Etapa 4 — Catálogo: Categorias e Marcas

**Duração estimada:** 2 dias
**RF atendidos:** RF005, RF006, RF007

### 4.1 Tarefas

| # | Tarefa |
|---|---|
| 4.1 | Migration `categories` — tenant_id, name, slug, description, image_path, parent_id, status, timestamps |
| 4.2 | Migration `brands` — tenant_id, name, slug, logo_path, description, status, timestamps |
| 4.3 | Model `Category` com trait `BelongsToTenant`, relação `parent`/`children`, slug auto-gerado |
| 4.4 | Model `Brand` com trait `BelongsToTenant` |
| 4.5 | `CategoryController` — CRUD com nested children; árvore completa |
| 4.6 | `BrandController` — CRUD |
| 4.7 | `SlugService` — geração de slug único por tenant (usa Str::slug + sufixo numérico se duplicado) |
| 4.8 | Admin: CRUD de categorias com árvore drag-and-drop |
| 4.9 | Admin: CRUD de marcas |

### 4.2 Testes

| Teste | O que valida |
|---|---|
| `SlugServiceTest` | Gera slug; detecta duplicidade e adiciona sufixo; aceita slug manual |
| `CategoryTest` | CRUD; relação parent/children; slug único por tenant |
| `CategoryTreeTest` | `GET /api/categories/tree` retorna árvore aninhada correta |
| `BrandTest` | CRUD com validações |
| `CategoryIsolationTest` | Categoria do tenant A não aparece em queries do tenant B |

### 4.3 Critérios de Validação

- [ ] `php artisan test --filter="Category|Brand|Slug"` — todos verdes
- [ ] Criar categoria pai "Roupas" e filha "Camisetas"; slug `/roupas/camisetas`
- [ ] Duas categorias com mesmo nome geram slugs diferentes

---

## Etapa 5 — Catálogo: Atributos, Produtos Simples e Variáveis

**Duração estimada:** 4 dias
**RF atendidos:** RF008, RF009, RF010, RF011, RF012, RF013, RF014, RF015, RF049

### 5.1 Arquitetura

```
Product (simples)
  ├── name, slug, description, sku, barcode
  ├── brand_id, category_id (principal)
  ├── pivot: product_category (secundárias)
  ├── weight, height, width, length
  ├── price, cost_price
  ├── meta_title, meta_description (SEO)
  └── images (polymorphic attachment)

Product (variável) → ProductVariant
  ├── Product (is_variable = true)
  │   └── product_attributes → attribute_id, attribute_value_id
  └── ProductVariant
       ├── product_id (pai)
       ├── sku, barcode, price, stock
       ├── weight, height, width, length
       └── images (polymorphic)
```

### 5.2 Tarefas

| # | Tarefa |
|---|---|
| 5.1 | Migration `attributes` — tenant_id, name, slug, status |
| 5.2 | Migration `attribute_values` — attribute_id, value, slug |
| 5.3 | Migration `products` — tenant_id, name, slug, short_desc, full_desc, sku, barcode, brand_id, category_id (principal), is_variable (bool), weight, height, width, length, price, cost_price, meta_title, meta_description, status |
| 5.4 | Migration `product_categories` — product_id, category_id (pivot) |
| 5.5 | Migration `product_attributes` — product_id, attribute_id, attribute_value_id |
| 5.6 | Migration `product_variants` — product_id, sku, barcode, price, stock, weight, height, width, length, rank |
| 5.7 | Migration `media` — polymorphic (product, variant, category, brand) via Spatie Media Library |
| 5.8 | Configurar Spatie Media Library com disco local; conversão de imagens |
| 5.9 | Model `Product` com relações, scope simples/variável, acesso a preço (usa variante mínima se variável) |
| 5.10 | Model `ProductVariant` com sku próprio, estoque, imagens |
| 5.11 | `AttributeController` + `AttributeValueController` — CRUD |
| 5.12 | `ProductController` — CRUD com suporte a variações (aninhado no request) |
| 5.13 | `ProductService::createVariable()` — gera combinações de atributos e cria variants automaticamente |
| 5.14 | Admin: Formulário de produto com atributos dinâmicos |
| 5.15 | Admin: Gerador de variações (matriz de atributos) |
| 5.16 | Admin: Upload e ordenação de imagens (drag-and-drop) |
| 5.17 | Admin: Campos SEO no formulário de produto |

### 5.3 Testes

| Teste | O que valida |
|---|---|
| `AttributeTest` | CRUD; valores associados |
| `ProductSimpleTest` | Criação de produto simples; slug único; validações de campos obrigatórios |
| `ProductVariableTest` | Criação com atributos; geração automática de variantes; cada variante com sku único |
| `ProductVariantTest` | Cada variante tem estoque, preço, sku próprios |
| `ProductImageTest` | Upload ordena; imagem principal; remoção |
| `ProductSEOTest` | meta_title e meta_description persistidos e retornados no resource |
| `ProductSearchTest` | Busca por nome, SKU, código de barras dentro do tenant |

### 5.4 Critérios de Validação

- [ ] `php artisan test --filter="Product|Attribute|Variant|Media"` — todos verdes
- [ ] Criar produto "Camiseta" com atributos Cor (Preto, Branco) e Tamanho (P, M, G) → 6 variantes geradas
- [ ] Cada variante com SKU, preço e estoque editáveis individualmente
- [ ] Upload de 3 imagens → definir principal → reordenar

---

## Etapa 6 — Controle de Estoque

**Duração estimada:** 2 dias
**RF atendidos:** RF016, RF017, RF018

### 6.1 Tarefas

| # | Tarefa |
|---|---|
| 6.1 | Migration `stock` — product_variant_id (ou product_id se simples), quantity, reserved, min_quantity |
| 6.2 | Migration `stock_movements` — stock_id, type (in/out/adjust), quantity, reason, user_id, order_id (nullable), metadata (JSON) |
| 6.3 | Model `Stock` + relação com variant/produto |
| 6.4 | Model `StockMovement` — polimórfico para origem da movimentação (order, manual, import) |
| 6.5 | `StockService` — `add()`, `remove()`, `reserve()`, `release()`, `adjust()` — todos registram movimento |
| 6.6 | `StockController` — GET status atual, POST ajuste manual, GET histórico |
| 6.7 | Observer `OrderObserver` — ao criar pedido: `reserve()`; ao cancelar: `release()`; ao pagar: `remove()` |
| 6.8 | Admin: Tela de estoque com tabela e filtro |
| 6.9 | Admin: Histórico de movimentações com filtro por período e tipo |

### 6.2 Testes

| Teste | O que valida |
|---|---|
| `StockServiceTest` | `add` incrementa; `remove` decrementa; `reserve` move para reserved; não permite remover mais que disponível |
| `StockReserveReleaseTest` | Reserva em pedido criado; liberação em cancelamento |
| `StockMovementTest` | Cada operação gera registro com tipo, quantidade, usuário |
| `StockHistoryTest` | Histórico retorna movimentações ordenadas por data |
| `StockMinQuantityTest` | Alertas quando quantity <= min_quantity |

### 6.3 Critérios de Validação

- [ ] `php artisan test --filter=Stock` — todos verdes
- [ ] Adicionar 100 unidades → reservar 10 (pedido criado) → available = 90, reserved = 10
- [ ] Cancelar pedido → available = 100, reserved = 0
- [ ] Histórico mostra todas as movimentações na ordem correta

---

## Etapa 7 — Gestão de Clientes e Endereços

**Duração estimada:** 2 dias
**RF atendidos:** RF019, RF020

### 7.1 Tarefas

| # | Tarefa |
|---|---|
| 7.1 | Migration `customers` — tenant_id, name, document, email, phone, birth_date, accepts_marketing, timestamps |
| 7.2 | Migration `customer_addresses` — customer_id, type (shipping/billing), street, number, complement, neighborhood, city, state, zip_code, is_default |
| 7.3 | Model `Customer` com trait `BelongsToTenant`, relação endereços |
| 7.4 | Model `CustomerAddress` |
| 7.5 | `CustomerController` — CRUD com busca por nome, email, documento |
| 7.6 | `CustomerAddressController` — CRUD nested em customer |
| 7.7 | `CustomerService` — validação de documento único por tenant |
| 7.8 | Admin: CRUD de clientes com tabela e busca |
| 7.9 | Admin: Gerenciamento de endereços |

### 7.2 Testes

| Teste | O que valida |
|---|---|
| `CustomerTest` | CRUD; validação de email/documento único dentro do tenant |
| `CustomerAddressTest` | CRUD nested; endereço padrão; múltiplos endereços |
| `CustomerSearchTest` | Busca por nome, email, documento retorna resultados corretos |
| `CustomerIsolationTest` | Cliente do tenant A não visível no tenant B |

### 7.3 Critérios de Validação

- [ ] `php artisan test --filter=Customer` — todos verdes
- [ ] Criar cliente com 2 endereços; definir um como padrão
- [ ] Buscar por documento retorna cliente correto

---

## Etapa 8 — Carrinho de Compras e Checkout

**Duração estimada:** 3 dias
**RF atendidos:** RF021, RF022, RF023, RF024

### 8.1 Arquitetura

```
Carrinho (persistido no DB para autenticados, Redis para visitantes)
  │
  ▼
Checkout Flow
  1. Identificação (cliente existente ou guest)
  2. Endereço de entrega
  3. Seleção de frete (via ShippingCore)
  4. Seleção de pagamento (via PaymentCore)
  5. Revisão
  6. Confirmação → cria Order
```

### 8.2 Tarefas

| # | Tarefa |
|---|---|
| 8.1 | Migration `carts` — tenant_id, customer_id (nullable), session_id, expires_at |
| 8.2 | Migration `cart_items` — cart_id, product_id, variant_id (nullable), quantity, price_at_time |
| 8.3 | Model `Cart` + `CartItem` com relações |
| 8.4 | `CartService` — `add`, `update`, `remove`, `get`, `clear`, `merge` (visitante → autenticado) |
| 8.5 | `CartController` — API para frontend da loja (adicionar, atualizar, remover, visualizar) |
| 8.6 | `CheckoutService` — orquestra identificação, validação de estoque, cálculo de frete, aplicação de cupom, criação de pedido |
| 8.7 | `CheckoutController` — endpoint `POST /api/checkout` com `CheckoutRequest` |
| 8.8 | Suporte a checkout como visitante (sem customer_id, apenas email + endereço no request) |
| 8.9 | Store Frontend: Página de carrinho (Next.js) |
| 8.10 | Store Frontend: Páginas do fluxo de checkout (identificação → endereço → frete → pagamento → revisão) |

### 8.3 Testes

| Teste | O que valida |
|---|---|
| `CartServiceTest` | Adicionar item; atualizar quantidade; remover; não permitir quantidade > estoque |
| `CartMergeTest` | Carrinho de visitante mergeia com carrinho de cliente ao autenticar |
| `CartExpirationTest` | Carrinho expirado é limpo pelo scheduler |
| `CheckoutServiceTest` | Fluxo completo com mock de ShippingCore e PaymentCore |
| `CheckoutGuestTest` | Checkout como visitante cria pedido sem customer_id |
| `CheckoutValidationTest` | Itens sem estoque são rejeitados; cupom inválido/expirado rejeitado |

### 8.4 Critérios de Validação

- [ ] `php artisan test --filter="Cart|Checkout"` — todos verdes
- [ ] Adicionar produtos ao carrinho → atualizar quantidade → remover item
- [ ] Carrinho de visitante persiste em Redis e aparece no Next.js
- [ ] Checkout completo gera pedido pendente

---

## Etapa 9 — Módulo de Frete (Core + Gateways)

**Duração estimada:** 4 dias
**RF atendidos:** RF025, RF026, RF027

### 9.1 Arquitetura Core + Gateway

```
┌─────────────────────────────────────────┐
│           ShippingCore                  │
│  ┌───────────────────────────────────┐  │
│  │ getRates(cart, address): Option[] │  │
│  │ generateLabel(order): Label       │  │
│  │ cancelLabel(order): void          │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│   getGateway(method, config)            │
│                 │                        │
└─────────────────┼────────────────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│ Fixed   │ │ Correios │ │ Jadlog   │
│ Gateway │ │ Gateway  │ │ Gateway  │
└─────────┘ └──────────┘ └──────────┘
```

**Contrato (Interface):**

```php
interface ShippingGateway
{
    /**
     * @param ShippingRequest $request Cart, address, dimensions
     * @return ShippingOption[] Lista de opções de frete
     */
    public function calculate(ShippingRequest $request): array;

    /**
     * @param string $serviceCode Código do serviço (PAC, SEDEX, etc.)
     * @param ShippingRequest $request
     * @return string External ID da etiqueta
     */
    public function generateLabel(string $serviceCode, ShippingRequest $request): string;

    /**
     * @param string $labelId ID externo da etiqueta
     */
    public function cancelLabel(string $labelId): void;

    /** Gateway name for display */
    public function name(): string;

    /** Available service codes (e.g., ['PAC', 'SEDEX']) */
    public function services(): array;
}
```

**ShippingCore:**

```php
class ShippingCore
{
    /** @var array<string, ShippingGateway> */
    private array $gateways = [];

    public function register(string $key, ShippingGateway $gateway): void
    {
        $this->gateways[$key] = $gateway;
    }

    public function getRates(ShippingRequest $request): array
    {
        $tenant = tenant();
        $activeGateways = $tenant->settings()->shipping_gateways;

        return collect($activeGateways)
            ->flatMap(fn($config) =>
                $this->gateways[$config['gateway']]
                    ->calculate($request)
            )
            ->sortBy('price')
            ->values()
            ->all();
    }

    public function getGateway(string $key): ShippingGateway
    {
        return $this->gateways[$key]
            ?? throw new GatewayNotFoundException($key);
    }
}
```

### 9.2 Tarefas

| # | Tarefa |
|---|---|
| 9.1 | Criar interface `App\Core\Shipping\Contracts\ShippingGateway` |
| 9.2 | Criar DTOs `ShippingRequest`, `ShippingOption`, `ShippingAddress` |
| 9.3 | Criar `ShippingCore` com registro dinâmico de gateways (via Service Provider) |
| 9.4 | Criar migration `shipping_rules` — tenant_id, gateway, service_code, free_from (decimal), min_value, max_weight, zip_ranges (JSON), status |
| 9.5 | Implementar `FixedShippingGateway` — retorna opções baseadas em regras cadastradas |
| 9.6 | Implementar `MelhorEnvioGateway` — HTTP client para API dos Correios |
| 9.7 | Implementar `FrenetGateway` — HTTP client para API da Jadlog |
| 9.8 | `ShippingRuleController` — CRUD de regras de frete por tenant |
| 9.9 | `ShippingServiceProvider` — registra todos os gateways no `ShippingCore` |
| 9.10 | Admin: Página de configuração de frete (gateways ativos, regras) |
| 9.11 | Store Frontend: Exibição de opções de frete no checkout |

### 9.3 Testes

| Teste | O que valida |
|---|---|
| `FixedShippingGatewayTest` | Retorna opções configuradas; respeita regra de frete grátis |
| `ShippingCoreTest` | `getRates` agrega múltiplos gateways; ordena por preço |
| `ShippingRuleServiceTest` | CRUD de regras; validação de faixas de CEP |
| `ShippingGatewayRegistrationTest` | Service Provider registra todos os gateways |
| `ShippingRateCalculationTest` (Feature) | Cenário: carrinho com itens, endereço → retorna opções |
| `CorreiosGatewayTest` | Mock HTTP; parse correto da resposta XML/JSON dos Correios |
| `JadlogGatewayTest` | Mock HTTP; parse correto da resposta |

### 9.4 Critérios de Validação

- [ ] `php artisan test --filter=Shipping` — todos verdes
- [ ] Cadastrar regra de frete fixo: R$ 15,00; grátis acima de R$ 200,00
- [ ] Carrinho de R$ 250,00 → opção "Grátis" aparece
- [ ] Checkout exibe opções de frete calculadas corretamente
- [ ] Trocar gateway (ex: Fixed → Correios) requer apenas configurar no admin, sem alterar código

---

## Etapa 10 — Módulo de Pagamento (Core + Gateways)

**Duração estimada:** 5 dias
**RF atendidos:** RF028, RF029, RF030, RF031

### 10.1 Arquitetura Core + Gateway

```
┌──────────────────────────────────────────────┐
│              PaymentCore                     │
│  ┌────────────────────────────────────────┐  │
│  │ charge(payment): PaymentResult         │  │
│  │ refund(payment): RefundResult          │  │
│  │ handleWebhook(gateway, request): void  │  │
│  │ reconcile(payment): Payment            │  │
│  └───────────────┬────────────────────────┘  │
│                  │                            │
│    getGateway(method, config)                │
│                  │                            │
└──────────────────┼────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Pix      │ │CreditCard│ │ Boleto   │
│ Gateway  │ │ Gateway  │ │ Gateway  │
└──────────┘ └──────────┘ └──────────┘
```

**Contrato (Interface):**

```php
interface PaymentGateway
{
    /** Processa pagamento */
    public function charge(PaymentRequest $request): PaymentResponse;

    /** Estorna pagamento */
    public function refund(string $transactionId, float $amount): RefundResponse;

    /** Consulta status de uma transação */
    public function getStatus(string $transactionId): StatusResponse;

    /** Nome do gateway para exibição */
    public function name(): string;

    /** Métodos suportados (pix, credit_card, boleto) */
    public function supportedMethods(): array;
}
```

### 10.2 Tarefas

| # | Tarefa |
|---|---|
| 10.1 | Criar interface `App\Core\Payment\Contracts\PaymentGateway` |
| 10.2 | Criar DTOs `PaymentRequest`, `PaymentResponse`, `RefundResponse`, `StatusResponse` |
| 10.3 | Criar `PaymentCore` com registro dinâmico de gateways |
| 10.4 | Criar migration `payments` — order_id, gateway, method, transaction_id, amount, status, metadata (JSON), paid_at |
| 10.5 | Criar migration `payment_configs` — tenant_id, gateway, method (pix/credit_card/boleto), credentials (JSON, encrypted), status |
| 10.6 | Implementar `GenericGateway` — Simula fluxo de pagamento |
| 10.9 | Rota `POST /api/webhooks/payment/{gateway}` — recebe notificações, despacha para PaymentCore |
| 10.10 | `PaymentCore::handleWebhook()` — valida assinatura, encontra Payment por transaction_id, atualiza status |
| 10.11 | Job `ReconcilePendingPayments` — scheduler para reconciliar pagamentos pendentes |
| 10.12 | `PaymentController` — status do pagamento; reembolso |
| 10.13 | `PaymentConfigController` — CRUD de configurações de gateway por tenant |
| 10.14 | Admin: Configuração de gateways (credenciais por método) |
| 10.15 | Store Frontend: Seleção de pagamento no checkout; exibição de QR Code Pix / boleto |

### 10.3 Testes

| Teste | O que valida |
|---|---|
| `PaymentCoreTest` | `charge` despacha para gateway correto; `refund` funciona; `handleWebhook` atualiza payment |
| `PixGatewayTest` | Mock HTTP; `charge` retorna QR code; `getStatus` retorna status correto |
| `CreditCardGatewayTest` | Mock HTTP; `charge` com cartão; resposta de aprovação/recusa |
| `BoletoGatewayTest` | Mock HTTP; `charge` retorna código de barras e URL |
| `WebhookTest` (Feature) | POST com payload falso → payment atualizado; assinatura inválida → 400 |
| `ReconciliationTest` | Job busca pagamentos pendentes e atualiza status |
| `PaymentConfigTest` | CRUD; credenciais criptografadas |

### 10.4 Critérios de Validação

- [ ] `php artisan test --filter=Payment` — todos verdes
- [ ] Checkout com GenericGateway → payment criado
- [ ] Webhook simulado atualiza payment.status de 'pending' para 'paid'
- [ ] Conciliação automática atualiza pagamentos pendentes
- [ ] Configurar novo gateway requer apenas implementar `PaymentGateway` e registrar

---

## Etapa 11 — Gestão de Pedidos, Status e Timeline

**Duração estimada:** 3 dias
**RF atendidos:** RF032, RF033, RF034, RF035, RF036, RF037, RF038

### 11.1 Tarefas

| # | Tarefa |
|---|---|
| 11.1 | Migration `orders` — tenant_id, customer_id (nullable), number (sequencial por tenant), subtotal, discount, shipping_cost, total, status, shipping_address (JSON), shipping_method, notes, timestamps |
| 11.2 | Migration `order_items` — order_id, product_id, variant_id, name_snapshot, sku_snapshot, price, quantity |
| 11.3 | Migration `order_transactions` — order_id, type (payment/shipping/status_change), data (JSON), user_id |
| 11.4 | Migration `order_statuses` — tenant_id, name, slug, color, is_default |
| 11.5 | Migration `order_status_transitions` — from_status_id, to_status_id (quais transições são permitidas) |
| 11.6 | Model `Order` + `OrderItem` + `OrderTransaction` com relações |
| 11.7 | `OrderService` — criação (snapshot de produto/preço), atualização de status, timeline |
| 11.8 | `OrderNumberService` — gera número sequencial por tenant usando lock no Redis |
| 11.9 | `OrderStatusController` — CRUD de status; definição de transições |
| 11.10 | `OrderController` — listagem, detalhe, atualização de status, timeline |
| 11.11 | Observer `PaymentObserver` → ao pagar, transita status para "Pago" (se transição permitida) |
| 11.12 | Observer `ShippingObserver` → ao gerar etiqueta, transita status para "Enviado" |
| 11.13 | Admin: Listagem de pedidos com filtros (status, período, cliente) |
| 11.14 | Admin: Detalhe do pedido com timeline completa |
| 11.15 | Admin: Configuração de status e transições (visual flowchart) |

### 11.2 Testes

| Teste | O que valida |
|---|---|
| `OrderNumberServiceTest` | Números sequenciais únicos por tenant; lock previne race condition |
| `OrderServiceTest` | Criação snapshot; cálculo de totais; aplicação de desconto |
| `OrderStatusTransitionTest` | Transição permitida funciona; transição não permitida lança exceção |
| `OrderTimelineTest` | Cada mudança de status gera transação no histórico |
| `OrderControllerTest` | GET lista pedidos; GET detalhe; PUT status |
| `PaymentToOrderObserverTest` | Pagamento confirmado → pedido transita automaticamente |
| `OrderIsolationTest` | Pedido do tenant A não visível no tenant B |

### 11.3 Critérios de Validação

- [ ] `php artisan test --filter=Order` — todos verdes
- [ ] Criar 3 pedidos no mesmo tenant → números 1, 2, 3
- [ ] Criar pedido no tenant B → número 1 (sequência independente)
- [ ] Transitar status pendente → pago → enviado → entregue funciona
- [ ] Tentar transitar entregue → pendente é rejeitado
- [ ] Timeline mostra todas as mudanças com timestamp e usuário

---

## Etapa 12 — Cupons de Desconto

**Duração estimada:** 2 dias
**RF atendidos:** RF039, RF040

### 12.1 Tarefas

| # | Tarefa |
|---|---|
| 12.1 | Migration `coupons` — tenant_id, code, type (percentage/fixed/free_shipping), value, starts_at, expires_at, max_uses, used_count, min_order_value, status |
| 12.2 | Model `Coupon` |
| 12.3 | `CouponService` — `validate(code, cart): CouponValidationResult`; `apply(coupon, cart): CartWithDiscount` |
| 12.4 | `CouponController` — CRUD |
| 12.5 | Integrar `CouponService` no `CheckoutService` |
| 12.6 | Admin: CRUD de cupons com regras de restrição |
| 12.7 | Store Frontend: Campo de cupom no carrinho/checkout |

### 12.2 Testes

| Teste | O que valida |
|---|---|
| `CouponValidationTest` | Cupom válido; expirado rejeitado; uso máximo excedido; valor mínimo não atingido |
| `CouponApplicationTest` | Percentual calcula desconto; fixo subtrai valor; free_shipping zera frete |
| `CouponUsedCountTest` | Após uso bem-sucedido, `used_count` incrementa |
| `CouponControllerTest` | CRUD; code único por tenant |

### 12.3 Critérios de Validação

- [ ] `php artisan test --filter=Coupon` — todos verdes
- [ ] Cupom "BLACK10" de 10% aplicado ao carrinho → desconto correto
- [ ] Cupom "FRETEGRATIS" → frete zerado
- [ ] Cupom expirado → rejeitado na validação

---

## Etapa 13 — Sistema de Router e Resolução de URLs

**Duração estimada:** 3 dias
**RF atendidos:** RF006, RF009, RF042 (slugs)

### 13.1 Arquitetura

O Router é o ponto central de resolução de URLs do site. Toda requisição do Next.js para uma URL pública (que não seja rota fixa do sistema como `/carrinho`, `/checkout`, `/busca`) passa por um único endpoint da API que identifica qual recurso corresponde àquele caminho.

```
Next.js [...slug]/page.tsx
  │  toda URL não fixa cai aqui
  │  ex: /camiseta-basica, /eletronicos, /sobre-nos, / masculino/camisetas
  ▼
GET /api/router/resolve?path=/camiseta-basica
  │
  ▼
RouterService
  │
  ├── ProductResolver  (priority 10)  → busca slug na tabela products
  ├── CategoryResolver (priority 20)  → busca slug na tabela categories
  ├── PageResolver     (priority 30)  → busca slug na tabela pages
  └── DefaultResolver  (priority 100) → fallback / 404
  │
  ▼
Resposta JSON:
{
  "type": "product",
  "data": { ... },      // resource completo
  "seo": { ... },       // meta title, meta description
  "status": 200
}
```

**Ordem de resolução:** Cada resolver é executado em ordem de prioridade. O primeiro que retornar um `RouteMatch` não-nulo vence. A ordem padrão é:

| Prioridade | Resolver | Comportamento |
|---|---|---|
| 10 | `ProductResolver` | Busca slug exato em `products` (status=publicado). Se tiver categoria, considera o path completo (ex: `masculino/camisetas`) |
| 20 | `CategoryResolver` | Busca slug em `categories` (status=ativo). Resolve hierarquia (ex: `masculino/camisetas` → categoria "camisetas" filha de "masculino") |
| 30 | `PageResolver` | Busca slug em `pages` (status=publicado). Exclui a home page (`is_home=true` é tratada separadamente) |
| 100 | `DefaultResolver` | Se nada resolveu: retorna `{type: 'not_found', status: 404}`. Pode ser configurado para redirect |

### 13.2 Contrato (Interface)

```php
namespace App\Core\Router\Contracts;

use App\Core\Router\DTOs\RouteMatch;

interface RouterResolver
{
    /**
     * Tenta resolver um path para um recurso.
     * Retorna null se este resolver não reconhece o path.
     */
    public function resolve(string $path): ?RouteMatch;

    /** Nome legível para debug/logs */
    public function name(): string;

    /** Prioridade: menor número = maior prioridade */
    public function priority(): int;
}
```

### 13.3 DTO RouteMatch

```php
namespace App\Core\Router\DTOs;

final readonly class RouteMatch
{
    public function __construct(
        public string $type,      // 'product' | 'category' | 'page' | 'home' | 'not_found'
        public array $data,       // Dados completos do recurso (formato resource da API)
        public array $seo = [],   // meta_title, meta_description
        public int $status = 200,
        public array $meta = [],  // breadcrumbs, redirect, etc.
    ) {}
}
```

### 13.4 RouterService

```php
namespace App\Core\Router;

class RouterService
{
    /** @var RouterResolver[] */
    private array $resolvers = [];

    public function register(RouterResolver $resolver): void
    {
        $this->resolvers[] = $resolver;
        // Ordena por prioridade a cada registro
        usort($this->resolvers, fn($a, $b) => $a->priority() <=> $b->priority());
    }

    public function resolve(string $path): RouteMatch
    {
        $cacheKey = "router:{$tenantId}:{$path}";
        // Verifica Redis primeiro
        $cached = Cache::tags(["router.{$tenantId}"])->get($cacheKey);
        if ($cached) return $cached;

        foreach ($this->resolvers as $resolver) {
            $match = $resolver->resolve($path);
            if ($match !== null) {
                Cache::tags(["router.{$tenantId}"])->put($cacheKey, $match, 3600);
                return $match;
            }
        }

        return new RouteMatch(type: 'not_found', data: [], status: 404);
    }
}
```

### 13.5 Tarefas

| # | Tarefa |
|---|---|
| 13.1 | Criar interface `App\Core\Router\Contracts\RouterResolver` |
| 13.2 | Criar DTO `RouteMatch` com propriedades `type`, `data`, `seo`, `status`, `meta` |
| 13.3 | Criar `RouterService` com `register()` e `resolve()`; ordenação por prioridade |
| 13.4 | Criar `ProductResolver` — busca slug em products; se o path contiver `/`, interpreta como categoria/produto |
| 13.5 | Criar `CategoryResolver` — busca slug em categories; resolve slugs aninhadas verificando hierarchy |
| 13.6 | Criar `PageResolver` — busca slug em pages (status=published, exclui is_home) |
| 13.7 | Criar `DefaultResolver` — fallback; sempre retorna RouteMatch com status 404; loga path não resolvido |
| 13.8 | Criar `RouterController` — endpoint `GET /api/router/resolve?path=` (rota pública, sem auth, tenant-aware) |
| 13.9 | Criar `RouterServiceProvider` — registra todos os resolvers no `RouterService` e registra como singleton |
| 13.10 | Cache Redis: keys prefixadas por tenant + tag para invalidação em massa |
| 13.11 | Invalidação de cache: observers de Product/Category/Page chamam `Cache::tags(["router.{$tenantId}"])->flush()` ao salvar/deletar |
| 13.12 | Configuração no Admin: permitir alterar ordem de prioridade dos resolvers por tenant (avançado — opcional no MVP) |
| 13.13 | Home page: `GET /api/router/resolve?path=/` retorna `{type: 'home', data: page.is_home}` |

### 13.6 Resolução de Slugs Hierárquicos

Para categorias e produtos dentro de categorias, o path pode ser multi-nível:

```
/masculino/camisetas        → CategoryResolver desmembra em slugs, navega a árvore
/masculino/camisetas/produto → ProductResolver verifica se o último segmento é um produto naquela categoria
```

Algoritmo do `CategoryResolver`:

```php
public function resolve(string $path): ?RouteMatch
{
    $segments = explode('/', trim($path, '/'));

    // Começa da raiz e navega nível por nível
    $parentId = null;
    $category = null;

    foreach ($segments as $slug) {
        $category = Category::where('slug', $slug)
            ->where('parent_id', $parentId)
            ->where('status', true)
            ->first();

        if (!$category) return null;
        $parentId = $category->id;
    }

    return new RouteMatch(
        type: 'category',
        data: (new CategoryResource($category->load('children')))->toArray(request()),
        seo: ['meta_title' => $category->meta_title, 'meta_description' => $category->meta_description],
    );
}
```

### 13.7 Testes

| Teste | O que valida |
|---|---|
| `RouterServiceTest` | `resolve` retorna primeiro match por prioridade; cache funciona; fallback quando nenhum resolver encontra |
| `ProductResolverTest` | Slug de produto retorna RouteMatch com type=product; slug inexistente retorna null |
| `CategoryResolverTest` | Slug simples retorna categoria; slug hierárquico (ex: `roupas/camisetas`) resolve corretamente; slug quebrado retorna null |
| `PageResolverTest` | Slug de página retorna RouteMatch; página rascunho retorna null; home page não é resolvida aqui |
| `DefaultResolverTest` | Sempre retorna RouteMatch(type: 'not_found', status: 404) |
| `RouterControllerTest` (Feature) | `GET /api/router/resolve?path=/camiseta` retorna JSON com type, data, seo; path inválido retorna 404 |
| `RouterCacheTest` | Resolução cacheada não repete queries; invalidação ao atualizar produto |
| `PriorityTest` | Dois resources com mesmo slug (ex: produto e página ambos com slug "contato") → resolver com menor prioridade vence |

### 13.8 Critérios de Validação

- [ ] `php artisan test --filter=Router` — todos verdes
- [ ] `GET /api/router/resolve?path=/camiseta-basica` → `{type: "product", data: {...}}`
- [ ] `GET /api/router/resolve?path=/eletronicos` → `{type: "category", data: {...}}`
- [ ] `GET /api/router/resolve?path=/roupas/camisetas` → `{type: "category", data: resolved nested category}` (após Etapa 14 — CMS criar páginas, também após ter categorias hierárquicas)
- [ ] `GET /api/router/resolve?path=/pagina-inexistente` → `{type: "not_found", status: 404}`
- [ ] Cache: segunda chamada ao mesmo path não executa queries SQL (verificar log)
- [ ] Ao atualizar nome de um produto e salvar → cache do router é invalidado

---

## Etapa 14 — CMS, Páginas e SEO

**Duração estimada:** 2 dias
**RF atendidos:** RF041, RF042, RF051

### 14.1 Tarefas

| # | Tarefa |
|---|---|
| 14.1 | Migration `pages` — tenant_id, title, slug, content (LONGTEXT, pode ser HTML ou JSON do builder), meta_title, meta_description, status, is_home, created_by |
| 14.2 | Model `Page` |
| 14.3 | `PageController` — CRUD; endpoint público `GET /api/pages/{slug}` (usado internamente; o Router é a interface pública principal) |
| 14.4 | Admin: CRUD de páginas com editor de texto rico (Tiptap ou similar) |
| 14.5 | Admin: Preview da página |
| 14.6 | Store Frontend: Renderização dinâmica de páginas (SSR via Next.js fetch do Router) |
| 14.7 | Registrar `PageResolver` no `RouterService` (já criado na Etapa 13) |

### 14.2 Testes

| Teste | O que valida |
|---|---|
| `PageTest` | CRUD; slug único por tenant; status rascunho/publicado |
| `PagePublicEndpointTest` | `GET /api/pages/{slug}` retorna apenas páginas publicadas |
| `PageSEOTest` | meta_title e meta_description no resource |
| `PageRenderTest` (Store) | Next.js renderiza conteúdo da página via API |
| `PageRouterIntegrationTest` | Router resolve slug de página via catch-all |

### 14.3 Critérios de Validação

- [ ] `php artisan test --filter=Page` — todos verdes
- [ ] Criar página "Sobre Nós" → acessível via `/sobre-nos` no Next.js (pelo Router)
- [ ] SEO tags renderizadas no `<head>`
- [ ] Página rascunho não acessível publicamente (Router retorna 404)
- [ ] `GET /api/router/resolve?path=/sobre-nos` → `{type: "page", data: {...}}`

---

## Etapa 15 — Editor Visual (CraftJS) e Home da Loja

**Duração estimada:** 5 dias
**RF atendidos:** RF043, RF044, RF045, RF046, RF047, RF048

### 15.1 Arquitetura

```
Admin (React)
  │
  ▼
CraftJS Editor
  │ monta árvore de componentes (JSON)
  ▼
POST /api/pages (content = JSON da árvore CraftJS)
  │
  ▼
MySQL (pages.content = JSON)

──────────────

Store Frontend (Next.js)
  │
  ▼
GET /api/router/resolve?path=/
  │ retorna {type: 'home', data: page.is_home} ou {type: 'page'}
  ▼
PageRenderer (React)
  │ interpreta JSON → renderiza componentes React
  ▼
HTML final (SSR)
```

**Componentes CraftJS suportados (React):**
- TextBlock, Title, Image, Button, Banner, Video, Spacer, Columns
- ProductGrid (busca produtos da API), CategoryGrid
- Carousel, CustomHTML

Cada componente tem props configuráveis e renderização responsiva (desktop/tablet/mobile).

### 15.2 Tarefas

| # | Tarefa |
|---|---|
| 15.1 | Instalar e configurar CraftJS no Admin (`@craftjs/core`) |
| 15.2 | Criar componentes CraftJS: `TextBlock`, `Title`, `Image`, `Button`, `Banner`, `Video`, `Spacer`, `Columns`, `ProductGrid`, `CategoryGrid`, `Carousel`, `CustomHTML` |
| 15.3 | Cada componente com painel de propriedades (settings) lateral |
| 15.4 | Responsividade: cada componente aceita configurações desktop/tablet/mobile |
| 15.5 | Serializador: salva árvore CraftJS como JSON no campo `content` da tabela `pages` |
| 15.6 | `PageRenderer` no Store (Next.js): componente que interpreta o JSON e renderiza componentes React |
| 15.7 | Templates: salvar página como template reutilizável (criar migration `page_templates`) |
| 15.8 | Home page: página especial (`is_home = true`) construída com editor |
| 15.9 | Admin: Interface do editor + preview em tempo real |
| 15.10 | Admin: Gerenciador de templates |

### 15.3 Testes

| Teste | O que valida |
|---|---|
| `PageBuilderSerializationTest` | JSON do CraftJS é salvo e recuperado corretamente |
| `PageRendererTest` (Store) | Componente renderiza cada tipo de bloco; Columns renderiza filhos aninhados |
| `PageBuilderComponentTest` | Cada componente CraftJS renderiza com props padrão |
| `PageTemplateTest` | CRUD de templates; aplicar template cria nova página com conteúdo |
| `ResponsiveTest` | Configurações desktop/tablet/mobile persistidas no JSON |

### 15.4 Critérios de Validação

- [ ] `php artisan test --filter="PageBuilder|Template"` — todos verdes
- [ ] `npm test --prefix admin` — componentes CraftJS renderizam
- [ ] `npm test --prefix site` — PageRenderer renderiza todos os blocos
- [ ] Criar página no editor visual → salvar → visualizar no store
- [ ] Salvar como template → criar nova página a partir do template
- [ ] Bloco "ProductGrid" exibe produtos reais da API

---

## Etapa 16 — Busca de Produtos

**Duração estimada:** 1 dia
**RF atendidos:** RF052

### 16.1 Tarefas

| # | Tarefa |
|---|---|
| 16.1 | `SearchController` — `GET /api/search?q=termo` busca por nome, SKU, código de barras |
| 16.2 | Full-text index no MySQL: colunas `name`, `sku`, `barcode` nas tabelas `products` + `product_variants` |
| 16.3 | Cache Redis para buscas frequentes (TTL 10 min) |
| 16.4 | Admin: Barra de busca no topo |
| 16.5 | Store Frontend: Campo de busca com resultados instantâneos (debounce) |

### 16.2 Testes

| Teste | O que valida |
|---|---|
| `SearchControllerTest` | Busca por nome retorna produtos; busca por SKU; busca vazia retorna vazio |
| `FullTextSearchTest` | Busca parcial funciona (ex: "camis" → "Camiseta") |

### 16.3 Critérios de Validação

- [ ] `php artisan test --filter=Search` — todos verdes
- [ ] Buscar "camiseta" retorna produtos com "Camiseta" no nome
- [ ] Buscar por SKU exato retorna o produto correto

---

## Etapa 17 — Dashboard e Relatórios

**Duração estimada:** 3 dias
**RF atendidos:** RF053, RF054

### 17.1 Tarefas

| # | Tarefa |
|---|---|
| 17.1 | `DashboardController` — `GET /api/dashboard` retorna métricas do tenant atual |
| 17.2 | Métricas: total de pedidos (hoje/mês), faturamento, ticket médio, produtos mais vendidos |
| 17.3 | `ReportController` — `GET /api/reports/sales?from=&to=`; `GET /api/reports/top-products`; `GET /api/reports/top-customers` |
| 17.4 | Cache Redis para métricas de dashboard (invalida ao criar/atualizar pedido) |
| 17.5 | Admin: Página de dashboard com cards e gráficos (Recharts) |
| 17.6 | Admin: Páginas de relatórios com filtros de período e exportação CSV |

### 17.2 Testes

| Teste | O que valida |
|---|---|
| `DashboardServiceTest` | Métricas calculadas corretamente; isoladas por tenant |
| `ReportServiceTest` | Vendas por período; top products; top customers |
| `DashboardControllerTest` | Endpoint retorna estrutura JSON esperada |
| `ReportExportTest` | Exportação CSV com dados corretos |

### 17.3 Critérios de Validação

- [ ] `php artisan test --filter="Dashboard|Report"` — todos verdes
- [ ] Dashboard mostra dados reais após criar pedidos
- [ ] Relatório de vendas filtra por período corretamente
- [ ] Exportação CSV funciona

---

## Etapa 18 — Templates de E-mail e Eventos

**Duração estimada:** 2 dias
**RF atendidos:** RF055, RF056

### 18.1 Tarefas

| # | Tarefa |
|---|---|
| 18.1 | Migration `email_templates` — tenant_id, event (order_created/order_paid/order_shipped/order_cancelled), subject, body (HTML com placeholders), status |
| 18.2 | Model `EmailTemplate` |
| 18.3 | `EmailTemplateController` — CRUD; preview com dados fake |
| 18.4 | Notifications: `OrderCreated`, `OrderPaid`, `OrderShipped`, `OrderCancelled` (Laravel Notifications com MailChannel) |
| 18.5 | Observers de Order que disparam notificações nos eventos correspondentes |
| 18.6 | Placeholder system: `{order_number}`, `{customer_name}`, `{order_total}`, `{store_name}`, `{order_link}` |
| 18.7 | Queue: todos os emails são enviados via queue (Horizon/Redis) |
| 18.8 | Admin: Editor de templates de email com preview |

### 18.2 Testes

| Teste | O que valida |
|---|---|
| `EmailTemplateTest` | CRUD; placeholders renderizados corretamente |
| `EmailNotificationTest` | Evento dispara notificação; email é enfileirado |
| `EmailPreviewTest` | Preview renderiza com dados de exemplo |
| `OrderEmailDispatchTest` | Pedido pago → email de "Pedido Pago" enviado com dados reais |

### 18.3 Critérios de Validação

- [ ] `php artisan test --filter="Email|Notification"` — todos verdes
- [ ] Criar template customizado → pedido pago dispara email com template do tenant
- [ ] Placeholders `{order_number}`, `{store_name}` renderizam corretamente
- [ ] Email falho vai para `failed_jobs`

---

## Etapa 19 — LGPD: Consentimento e Anonimização

**Duração estimada:** 2 dias
**RF atendidos:** RF057, RF058

### 19.1 Tarefas

| # | Tarefa |
|---|---|
| 19.1 | Migration `consents` — tenant_id, customer_id, type (terms/privacy/marketing), accepted_at, ip_address |
| 19.2 | Endpoint `POST /api/consent` — registra aceite de termos/política |
| 19.3 | Checkout exige aceite de termos (se configurado no tenant) |
| 19.4 | `AnonymizationService` — anonimiza dados de cliente: nome → "Anônimo", email → hash, documento → hash, phone → null, endereços removidos |
| 19.5 | Endpoint `POST /api/customers/{id}/anonymize` |
| 19.6 | Command `php artisan lgpd:anonymize-expired` — scheduler para anonimização automática |
| 19.7 | Admin: Configuração de período de retenção |
| 19.8 | Admin: Botão "Anonimizar" no detalhe do cliente |

### 19.2 Testes

| Teste | O que valida |
|---|---|
| `ConsentTest` | Registro de aceite; recusa bloqueia checkout se obrigatório |
| `AnonymizationServiceTest` | Dados anonimizados; histórico de pedidos preservado (sem PII) |
| `AnonymizationCommandTest` | Clientes fora do período de retenção são anonimizados |
| `CustomerAnonymizedTest` | Cliente anonimizado não aparece em buscas por nome/email originais |

### 19.3 Critérios de Validação

- [ ] `php artisan test --filter="Consent|Anonymi"` — todos verdes
- [ ] Aceitar termos → consent registrado
- [ ] Anonimizar cliente → dados PII substituídos; pedidos preservados
- [ ] Command anonimiza clientes expirados

---

## Etapa 20 — Frontend da Loja (Next.js)

**Duração estimada:** 6 dias
**RF atendidos:** Integração completa da experiência de compra

### 20.1 Arquitetura Next.js com Router

Todas as rotas públicas do site passam pelo Router. O Next.js usa um catch-all `[...slug]` que consulta a API de Router para identificar o tipo de recurso (produto, categoria, página CMS) e renderiza o componente apropriado.

**Rotas fixas do sistema** (NÃO passam pelo Router — são rotas do próprio Next.js):
- `/carrinho` — Carrinho de compras (Client Component)
- `/checkout` — Fluxo de checkout (Client Component)
- `/busca` — Resultados de busca

**Todas as demais rotas** passam pelo `[...slug]`:
- `/` → Home (Router retorna `type: 'home'`)
- `/camiseta-basica` → Produto (Router retorna `type: 'product'`)
- `/eletronicos` → Categoria (Router retorna `type: 'category'`)
- `/masculino/camisetas` → Categoria hierárquica
- `/sobre-nos` → Página CMS (Router retorna `type: 'page'`)

```
Navegador
  │ acessa: /camiseta-basica-preta
  ▼
Next.js App Router
  │ a rota NÃO é /carrinho, /checkout, /busca
  │ cai no catch-all: [...slug]/page.tsx
  ▼
GET /api/router/resolve?path=/camiseta-basica-preta
  │
  ▼
Resposta: { type: "product", data: {...}, seo: {...} }
  │
  ▼
Switch por type:
  ├── "product"   → ProductRenderer
  ├── "category"  → CategoryRenderer
  ├── "page"      → PageRenderer
  ├── "home"      → PageRenderer (renderiza página is_home)
  └── "not_found" → Next.js notFound()
```

**Estrutura de diretórios:**

```
src/app/
├── layout.tsx               # Layout global + TenantProvider
├── page.tsx                 # Home (fetch do Router com path="/")
├── carrinho/
│   └── page.tsx             # Carrinho (Client Component)
├── checkout/
│   └── page.tsx             # Checkout (Client Component)
├── busca/
│   └── page.tsx             # Resultados de busca
└── [...slug]/
    └── page.tsx             # Catch-all: consulta Router API
                             # e renderiza pelo tipo
```

### 20.2 Implementação do Catch-All no Next.js

```typescript
// src/app/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import { resolveRoute } from '@/lib/router';
import { ProductRenderer } from '@/components/renderers/ProductRenderer';
import { CategoryRenderer } from '@/components/renderers/CategoryRenderer';
import { PageRenderer } from '@/components/renderers/PageRenderer';

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const match = await resolveRoute(path);

  switch (match.type) {
    case 'product':
      return <ProductRenderer product={match.data} />;
    case 'category':
      return <CategoryRenderer category={match.data} />;
    case 'page':
    case 'home':
      return <PageRenderer content={match.data.content} page={match.data} />;
    case 'not_found':
    default:
      notFound();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const match = await resolveRoute(path);

  return {
    title: match.seo?.meta_title ?? 'Loja',
    description: match.seo?.meta_description ?? '',
  };
}
```

### 20.3 Lib de Router no Next.js

```typescript
// src/lib/router.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface RouteMatch {
  type: 'product' | 'category' | 'page' | 'home' | 'not_found';
  data: any;
  seo?: { meta_title?: string; meta_description?: string };
  status: number;
  meta?: { breadcrumbs?: string[] };
}

export async function resolveRoute(path: string): Promise<RouteMatch> {
  const headers = await import('next/headers');
  const host = (await headers.headers()).get('host') || '';

  const res = await fetch(
    `${API_BASE}/api/router/resolve?path=${encodeURIComponent(path)}`,
    {
      headers: {
        'X-Tenant-Domain': host,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60, tags: [`router-${path}`] },
    }
  );

  if (!res.ok) {
    return { type: 'not_found', data: null, status: 404 };
  }

  return res.json();
}
```

### 20.4 Renderers

Cada renderer é um Server Component que recebe os dados do Router e monta a UI:

| Renderer | Responsabilidade |
|---|---|
| `ProductRenderer` | Exibe detalhes do produto: imagens, variantes (seleção de cor/tamanho), preço, descrição, botão comprar |
| `CategoryRenderer` | Exibe nome da categoria, breadcrumbs, grid de produtos com paginação e filtros |
| `PageRenderer` | Renderiza conteúdo da página CMS (HTML ou JSON do CraftJS) |
| `SearchRenderer` | Exibe resultados de busca com grid de produtos (usado na rota `/busca`) |

### 20.5 SEO Dinâmico

Toda página usa `generateMetadata()` com os dados retornados pelo Router. Cada resolver (ProductResolver, CategoryResolver, PageResolver) já inclui `meta_title` e `meta_description` no `RouteMatch.seo`.

### 20.6 Tarefas

| # | Tarefa |
|---|---|
| 20.1 | Criar `src/lib/router.ts` — função `resolveRoute()` que chama `GET /api/router/resolve` |
| 20.2 | Criar `src/app/[...slug]/page.tsx` — catch-all com switch por tipo de recurso |
| 20.3 | Criar `src/app/page.tsx` — home page que chama `resolveRoute('/')` |
| 20.4 | Criar `ProductRenderer` — galeria de imagens, seletor de variantes, preço, descrição, botão "Adicionar ao Carrinho" |
| 20.5 | Criar `CategoryRenderer` — breadcrumbs, grid de produtos, paginação, ordenação |
| 20.6 | Criar `PageRenderer` — renderiza conteúdo CMS (suporta HTML e JSON do CraftJS) |
| 20.7 | Criar `src/app/carrinho/page.tsx` — carrinho (Client Component) com `CartService` via API |
| 20.8 | Criar `src/app/checkout/page.tsx` — checkout multi-step (Client Component) |
| 20.9 | Criar `src/app/busca/page.tsx` — página de resultados de busca |
| 20.10 | `generateMetadata()` em todas as páginas com dados de SEO do Router |
| 20.11 | Responsividade completa (Tailwind CSS) |
| 20.12 | Testes com Vitest + Testing Library |

### 20.7 Testes

| Teste | O que valida |
|---|---|
| `RouterLibTest` | `resolveRoute('/camiseta')` retorna RouteMatch com type=product |
| `CatchAllPageTest` | Rota `/camiseta-basica` renderiza ProductRenderer |
| `CatchAllPageTest` | Rota `/eletronicos` renderiza CategoryRenderer |
| `CatchAllPageTest` | Rota `/sobre-nos` renderiza PageRenderer |
| `CatchAllPageTest` | Rota inexistente dispara notFound() |
| `ProductRendererTest` | Renderiza nome, preço, imagens; variantes selecionáveis |
| `CategoryRendererTest` | Renderiza breadcrumbs e grid de produtos |
| `CartTest` | Adicionar, atualizar, remover itens via UI |
| `CheckoutTest` | Fluxo completo simulado com mock de API |
| `PageRendererTest` | Renderiza todos os tipos de bloco do editor visual |
| `SEOTest` | `generateMetadata()` retorna meta tags corretas para cada tipo |
| `SearchTest` | Busca funcional com resultados na página `/busca` |

### 20.8 Critérios de Validação

- [ ] `npm test --prefix site` — todos verdes
- [ ] Navegar: home → `/camiseta-basica` → adicionar ao carrinho → checkout
- [ ] Navegar: `/eletronicos` → breadcrumbs corretos → produtos da categoria
- [ ] Navegar: `/sobre-nos` → conteúdo CMS renderizado
- [ ] URL inexistente → página 404 estilizada
- [ ] Selecionar variante (cor/tamanho) no ProductRenderer atualiza preço e imagem
- [ ] SEO tags presentes em todas as páginas (verificar no View Source)
- [ ] Busca retorna resultados e navega para produto
- [ ] Rotas fixas (`/carrinho`, `/checkout`) funcionam sem interferir no catch-all

---

## Etapa 21 — Integração Final e Testes End-to-End

**Duração estimada:** 3 dias

### 21.1 Tarefas

| # | Tarefa |
|---|---|
| 21.1 | Testes de integração entre backend e store (Pest ou PHPUnit Feature + msw no Next.js) |
| 21.2 | Teste E2E: cadastro de empresa → configuração de loja → criação de produtos → compra completa |
| 21.3 | Teste de concorrência: múltiplos tenants simultâneos sem vazamento de dados |
| 21.4 | Teste de carga básico (k6 ou Artillery): checkout, listagem de produtos |
| 21.5 | Revisão de segurança: SQL injection, XSS, CSRF, rate limiting |
| 21.6 | Documentação da API (Scramble ou Scribe) |
| 21.7 | README com instruções de setup |
| 21.8 | CI/CD pipeline (GitHub Actions): lint → tests → build |

### 21.2 Critérios de Validação Finais

- [ ] Todos os testes passam (`php artisan test`, `npm test --prefix admin`, `npm test --prefix site`)
- [ ] Fluxo de compra completo funcional em 2 tenants diferentes simultaneamente
- [ ] Dados de tenant A inacessíveis no tenant B
- [ ] Documentação da API acessível em `/docs/api`
- [ ] Setup limpo: `docker compose up` → plataforma funcional

---

## Apêndice A — Resumo de Testes

| Etapa | Testes Unitários | Testes Feature | Total Aprox. |
|---|---|---|---|
| 1 - Multi-Tenant | 3 | 2 | 5 |
| 2 - Empresas | 2 | 2 | 4 |
| 3 - ACL | 3 | 3 | 6 |
| 4 - Categorias/Marcas | 3 | 3 | 6 |
| 5 - Produtos | 5 | 4 | 9 |
| 6 - Estoque | 3 | 2 | 5 |
| 7 - Clientes | 2 | 2 | 4 |
| 8 - Carrinho/Checkout | 3 | 3 | 6 |
| 9 - Frete | 4 | 3 | 7 |
| 10 - Pagamento | 5 | 4 | 9 |
| 11 - Pedidos | 4 | 3 | 7 |
| 12 - Cupons | 3 | 1 | 4 |
| 13 - Router | 3 | 5 | 8 |
| 14 - CMS | 2 | 3 | 5 |
| 15 - Editor Visual | 2 | 2 (+ admin/site) | 4 |
| 16 - Busca | 1 | 1 | 2 |
| 17 - Dashboard | 3 | 2 | 5 |
| 18 - E-mail | 3 | 2 | 5 |
| 19 - LGPD | 2 | 2 | 4 |
| 20 - Store Frontend | — | 10 (Vitest) | 10 |
| 21 - Integração | — | 3 (E2E) | 3 |
| **Total** | **56** | **60** | **116** |

---

## Apêndice B — Comandos Rápidos

```bash
# Backend
cd backend
php artisan test                          # Todos os testes
php artisan test --filter=Product         # Testes de produto
php artisan migrate:fresh --seed          # Reset e seed
php artisan horizon                       # Iniciar queue worker

# Admin
cd admin
npm run dev                               # Dev server
npm test                                  # Testes
npm run lint                              # Lint

# Site (Next.js)
cd site
npm run dev                               # Dev server
npm test                                  # Testes
npm run build                             # Build de produção

# Docker
docker compose up -d                      # Sobe todos os serviços
docker compose exec app php artisan test  # Testes dentro do container
```

---

## Apêndice C — Glossário de Padrões

| Padrão | Aplicação |
|---|---|---|
| **Core + Gateway** | PaymentCore/ShippingCore são classes concretas que orquestram; Gateways implementam interface e são plugáveis |
| **Router + Resolver** | RouterService orquestra resolução de URLs; cada Resolver implementa interface e concorre por prioridade |
| **Catch-all Route (Next.js)** | `[...slug]` captura toda URL não-fixa; consulta API Router para decidir o que renderizar |
| **Global Scope (Eloquent)** | TenantScope aplica `where('tenant_id', ...)` automaticamente em toda query |
| **Trait Boot** | `BelongsToTenant` usa `bootTraitName()` do Eloquent para auto-atribuição |
| **Service Layer** | Regras de negócio em Services injetáveis; Controllers apenas delegam |
| **FormRequest** | Validação + autorização em classes dedicadas; nunca no controller |
| **DTO Imutável** | Objetos de transferência `readonly` entre camadas (especialmente Core↔Gateway) |
| **Observer + Event** | Side effects (email, estoque, status) via observers que disparam de eventos Eloquent |
| **Job + Queue** | Toda operação lenta (email, conciliação, exportação) é enfileirada |
| **Repository Pattern via Eloquent** | Scopes nomeados nos models (`scopePublished`, `scopeActive`) no lugar de repositories separados |
| **TanStack Query** | Cache declarativo, invalidate por chave, optimistic updates para UX |
| **SSR + ISR (Next.js)** | Páginas públicas com `revalidate`; páginas de checkout como Client Components |
