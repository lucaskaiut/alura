# Design System — Njord

## 1. Psicologia das Cores

| Cor | Hex | Psicologia | Uso |
|---|---|---|---|
| **Azul Profundo** (Primary) | `#1e3a5f` | Confiança, segurança, profissionalismo | Headers, sidebar, botões primários |
| **Azul Claro** (Primary Light) | `#3b82f6` | Clareza, tecnologia, calma | Links, elementos interativos, badges |
| **Verde Esmeralda** (Success) | `#10b981` | Crescimento, sucesso, dinheiro | Confirmações, status "pago", "entregue" |
| **Âmbar** (Warning) | `#f59e0b` | Atenção, energia, cautela | Alertas, status "pendente", "aguardando" |
| **Vermelho Suave** (Danger) | `#ef4444` | Urgência, erro, parada | Erros, exclusão, status "cancelado" |
| **Cinza Neutro** (Gray Scale) | `#6b7280` | Neutralidade, equilíbrio | Textos secundários, bordas, backgrounds |
| **Branco** (Surface) | `#ffffff` | Pureza, simplicidade | Cards, fundos de conteúdo |
| **Off-white** (Background) | `#f8fafc` | Leveza, respiro | Fundo da página |

## 2. Tokens de Cores (Tailwind CSS v4)

```css
@theme {
  /* Primary - Confiança e profissionalismo */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e3a5f;
  --color-primary-900: #1e2d4d;
  --color-primary-950: #0f172a;

  /* Success - Verde esmeralda */
  --color-success-50: #ecfdf5;
  --color-success-500: #10b981;
  --color-success-700: #047857;

  /* Warning - Âmbar */
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;

  /* Danger - Vermelho */
  --color-danger-50: #fef2f2;
  --color-danger-500: #ef4444;
  --color-danger-700: #b91c1c;

  /* Surface & Background */
  --color-surface: #ffffff;
  --color-bg: #f8fafc;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-text-placeholder: #9ca3af;
}
```

## 3. Tipografia

- **Font Family:** Inter (sans-serif) — limpa, moderna, excelente legibilidade
- **Scale:** 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px
- **Headings:** Semibold (600), tracking tight
- **Body:** Regular (400), leading relaxed
- **Code/Mono:** JetBrains Mono

## 4. Componentes

### 4.1 Tabela Responsiva (DataTable)

Comportamento: Colunas com prioridade. Em telas menores, colunas de baixa prioridade
são movidas para uma área expansível em cada linha (drawer/accordion).

```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Nome', priority: 1 },
    { key: 'email', label: 'E-mail', priority: 2 },
    { key: 'status', label: 'Status', priority: 3 },
    { key: 'actions', label: 'Ações', priority: 1, align: 'right' },
  ]}
  data={items}
/>
```

- **Priority 1:** Sempre visível (nome, ações)
- **Priority 2:** Visível até tablet
- **Priority 3:** Visível apenas desktop; colapsa em linha expansível

### 4.2 DatePicker

Componente personalizado com:
- Navegação por mês/ano com setas
- Grid de dias do mês
- Destaque do dia atual e dia selecionado
- Suporte a range (data inicial e final)
- Input com máscara e ícone de calendário
- Popover posicionado abaixo do input

### 4.3 Sidebar

- Colapsável (ícone + texto → apenas ícone)
- Seções agrupadas por módulo
- Item ativo com indicador lateral azul
- Background: primary-900

### 4.4 Formulários

- Labels acima do input
- Inputs com borda cinza, focus ring primary-500
- Mensagens de erro em danger-500 abaixo do campo
- Botão primary com hover state mais escuro

## 5. Ícones — Lucide

Instalar `lucide-react`. Usar tamanhos: 16px (inline), 20px (botões), 24px (ícones standalone).

## 6. Responsividade (Tailwind breakpoints)

- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (wide)
- `2xl`: 1536px

## 7. Animações

- Transições sutis: `transition-all duration-200`
- Sidebar: slide + fade, 250ms ease-in-out
- Modal: fade in overlay + scale up content
- Tabela expand: max-height transition
- Loading: shimmer/skeleton (pulsar gradiente)
