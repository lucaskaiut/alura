# Njord — Plataforma SaaS de E-Commerce Multi-Tenant

## Requisitos

- Docker e Docker Compose
- Node.js 22+ (para desenvolvimento local dos frontends)
- Portas disponíveis: 8080 (API), 3306 (MySQL), 6379 (Redis)

## Início Rápido

```bash
# 1. Subir a infraestrutura
docker compose up -d

# 2. Rodar migrations e seeds
docker compose run --rm app php artisan migrate --seed

# 3. Acessar a API
curl -H "X-Tenant-Domain: demo" http://localhost:8080/api/ping

# 4. Login (admin padrão)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: demo" \
  -d '{"email":"admin@njord.com","password":"password"}'
```

## Credenciais Padrão

| Campo | Valor |
|---|---|
| Tenant | demo |
| Email | admin@njord.com |
| Senha | password |

## Estrutura

```
njord/
├── api/          # Laravel 13 API (PHP 8.4)
├── admin/        # React SPA (Vite + TanStack Query)
├── site/         # Next.js Store Frontend
├── docker/       # Configurações Docker
├── docs/         # Documentação
└── docker-compose.yml
```

## Desenvolvimento

### API (Laravel)
```bash
# Testes
docker compose run --rm app php artisan test

# Tinker
docker compose run --rm app php artisan tinker
```

### Admin (React SPA)
```bash
cd admin
npm install
npm run dev        # http://localhost:5173
```

### Site (Next.js)
```bash
cd site
npm install
npm run dev        # http://localhost:3000
```

## Serviços Docker

| Serviço | Container | Porta |
|---|---|---|
| Nginx | njord-nginx | 8080 |
| PHP-FPM | njord-app | — |
| Horizon | njord-horizon | — |
| Scheduler | njord-scheduler | — |
| MySQL 8.4 | njord-mysql | 3306 |
| Redis 7 | njord-redis | 6379 |

## API Endpoints Principais

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/ping | Health check |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Usuário atual |
| GET | /api/router/resolve?path= | Resolver URL |
| GET | /api/categories | Listar categorias |
| POST | /api/categories | Criar categoria |
| GET | /api/products | Listar produtos |
| POST | /api/products | Criar produto |
| GET | /api/orders | Listar pedidos |
| GET | /api/customers | Listar clientes |
| GET | /api/coupons | Listar cupons |

*Rotas administrativas requerem token Bearer no header Authorization.*

## Multi-Tenant

Cada tenant é identificado via header `X-Tenant-Domain` (ex: `X-Tenant-Domain: demo`).
Dados são isolados por tenant_id em todas as tabelas.

Para adicionar um novo tenant:
```bash
curl -X POST http://localhost:8080/api/tenants \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: demo" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"name":"Nova Loja","slug":"nova-loja","subdomain":"nova"}'
```

## Licença

MIT
