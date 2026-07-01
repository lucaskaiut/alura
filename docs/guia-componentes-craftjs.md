# Guia de Componentes — CraftJS Page Builder

## Formato JSON

O conteúdo de uma página é um objeto JSON onde cada chave é um ID de nó. O nó raiz sempre tem ID `"ROOT"`.

```jsonc
{
  "ROOT": {
    "type": "RootContainer",
    "displayName": "RootContainer",
    "props": { "id": "ROOT" },
    "custom": {},
    "parent": null,
    "nodes": ["node_1", "node_2"],          // filhos diretos (array de IDs)
    "linkedNodes": {},                        // filhos via Element com id (chave -> ID)
    "hidden": false,
    "isCanvas": true
  },
  "node_1": {
    "type": "Title",                          // nome do componente (resolver key)
    "displayName": "Title",
    "props": {                                // propriedades do componente
      "text": "Meu Título",
      "level": "h1",
      "align": "center",
      "color": "#111827"
    },
    "custom": {},
    "parent": "ROOT",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  }
}
```

### Regras importantes

- `nodes`: filhos diretos (adicionados via drag/click na área de conteúdo)
- `linkedNodes`: filhos via `<Element id="...">` (usado em Container e Columns). A chave é o nome lógico, o valor é o ID real do nó
- `ROOT` sempre existe e é o ponto de entrada. Seus `nodes` são renderizados na página
- `isCanvas`: `true` indica que o nó aceita filhos (drop zone)
- `type`: nome do componente conforme lista abaixo

---

## Componentes

### TextBlock — Texto

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `content` | string (HTML) | `"Digite seu texto aqui..."` | Conteúdo do texto (aceita HTML) |
| `fontSize` | number | `16` | Tamanho da fonte em px |
| `color` | string | `"#111827"` | Cor do texto (hex) |
| `textAlign` | `"left" \| "center" \| "right"` | `"left"` | Alinhamento |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem (px ou "auto") |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Espaçamento interno (px) |

```json
{
  "type": "TextBlock",
  "props": { "content": "<p>Olá mundo</p>", "fontSize": 18, "color": "#333", "textAlign": "left" },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### Title — Título

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `text` | string | `"Título da seção"` | Texto do título |
| `level` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6"` | `"h2"` | Nível semântico |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Alinhamento |
| `color` | string | `"#111827"` | Cor do texto |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |

```json
{
  "type": "Title",
  "props": { "text": "Bem-vindo", "level": "h1", "align": "center", "color": "#1e3a5f" },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### ImageBlock — Imagem

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `src` | string | `""` | URL da imagem |
| `alt` | string | `""` | Texto alternativo |
| `href` | string | `""` | Link ao clicar (opcional) |
| `borderRadius` | number | `8` | Bordas arredondadas em px |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |

```json
{
  "type": "ImageBlock",
  "props": { "src": "https://exemplo.com/foto.jpg", "alt": "Foto", "borderRadius": 12 },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### ButtonBlock — Botão

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | string | `"Clique aqui"` | Texto do botão |
| `href` | string | `"#"` | Link de destino |
| `variant` | `"primary" \| "secondary" \| "outline"` | `"primary"` | Estilo: azul / cinza / contorno |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamanho |
| `borderRadius` | number | `8` | Bordas arredondadas em px |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem (padding não disponível) |

```json
{
  "type": "ButtonBlock",
  "props": { "label": "Comprar agora", "href": "/produtos", "variant": "primary", "size": "lg" },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### Banner — Banner com imagem de fundo

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `imageSrc` | string | `""` | URL da imagem de fundo |
| `title` | string | `"Título do Banner"` | Título principal |
| `subtitle` | string | `""` | Subtítulo |
| `buttonLabel` | string | `""` | Texto do botão (vazio = sem botão) |
| `buttonHref` | string | `""` | Link do botão |
| `overlayOpacity` | number | `40` | Opacidade do overlay escuro (0-100). 0 = sem overlay |
| `height` | number | `300` | Altura em px |
| `textColor` | string | `"#ffffff"` | Cor do texto |
| `borderRadius` | number | `8` | Bordas arredondadas em px |

```json
{
  "type": "Banner",
  "props": {
    "imageSrc": "https://exemplo.com/banner.jpg",
    "title": "Promoção de Verão",
    "subtitle": "Até 50% de desconto",
    "buttonLabel": "Ver ofertas",
    "buttonHref": "/promocoes",
    "overlayOpacity": 30,
    "height": 400,
    "textColor": "#ffffff",
    "borderRadius": 12
  },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### VideoBlock — Vídeo

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `url` | string | `""` | URL do vídeo (YouTube ou Vimeo) |
| `platform` | `"youtube" \| "vimeo"` | `"youtube"` | Plataforma |
| `aspectRatio` | `"16:9" \| "4:3" \| "1:1"` | `"16:9"` | Proporção |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |
| `borderRadius` | number | `8` | Bordas arredondadas em px |

```json
{
  "type": "VideoBlock",
  "props": { "url": "https://www.youtube.com/watch?v=abc123", "platform": "youtube", "aspectRatio": "16:9" },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### Spacer — Espaçador

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `height` | number | `32` | Altura em px |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem (padding não disponível) |

```json
{
  "type": "Spacer",
  "props": { "height": 60 },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

### Columns — Colunas

| Prop | Tipo | Default | Descrição |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |
|------|------|---------|-----------|
| `columns` | `2 \| 3 \| 4` | `2` | Número de colunas |
| `gap` | number | `16` | Espaçamento entre colunas (px) |
| `borderRadius` | number | `8` | Bordas arredondadas em px |

**IMPORTANTE**: Columns usa `linkedNodes` para referenciar as colunas internas. Cada coluna é um `ColumnCell` (canvas) que aceita filhos.

```json
{
  "type": "Columns",
  "props": { "columns": 3, "gap": 16, "borderRadius": 8 },
  "parent": "ROOT",
  "nodes": [],
  "linkedNodes": {
    "abc123-col-0": "cell_id_1",
    "abc123-col-1": "cell_id_2",
    "abc123-col-2": "cell_id_3"
  },
  "isCanvas": false
}
```

As células (`ColumnCell`) precisam existir como nós separados:

```json
{
  "cell_id_1": {
    "type": "ColumnCell",
    "displayName": "ColumnCell",
    "props": {},
    "parent": "abc123",
    "nodes": ["text_id"],       
    "isCanvas": true
  }
}
```

---

### Container — Contêiner flexível

Contêiner com largura, altura e alinhamento configurável via campos de texto livre. Aceita arquivos dentro de uma área interna.

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `width` | `number \| "auto" \| "100%" \| "800px"` | `"auto"` | Largura: número (px), "auto", porcentagem ou com unidade |
| `height` | `number \| "auto" \| "50%" \| "400px"` | `"auto"` | Altura: número (px), "auto", porcentagem ou com unidade |
| `hAlign` | `"left" \| "center" \| "right"` | `"left"` | Alinhamento horizontal do conteúdo |
| `vAlign` | `"top" \| "center" \| "bottom" \| "stretch"` | `"top"` | Alinhamento vertical |
| `backgroundColor` | string | `"transparent"` | Cor de fundo (hex ou "transparent") |
| `padding` | number | `0` | Espaçamento interno em px |
| `borderRadius` | number | `0` | Bordas arredondadas em px |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |

**IMPORTANTE**: Container usa `linkedNodes` para a área de conteúdo interna (chave `{id}-content`).

```json
{
  "type": "Container",
  "props": { "height": 200, "hAlign": "center", "vAlign": "center", "backgroundColor": "#f8fafc", "padding": 16, "borderRadius": 12 },
  "parent": "ROOT",
  "nodes": [],
  "linkedNodes": { "container_id-content": "inner_cell_id" },
  "isCanvas": false
}
```

A célula interna:

```json
{
  "inner_cell_id": {
    "type": "ColumnCell",
    "displayName": "ColumnCell",
    "props": {},
    "parent": "container_id",
    "nodes": ["child_component_id"],
    "isCanvas": true
  }
}
```

---

### ProductGrid — Grade de produtos

Exibe um grid de produtos reais selecionados via modal de busca no editor. No site, busca os produtos pela API pública e renderiza cards com imagem, nome, preço e botão adicionar ao carrinho.

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `title` | string | `"Produtos em destaque"` | Título da seção |
| `productIds` | `number[]` | `[]` | IDs dos produtos selecionados |
| `limit` | number | `4` | Quantidade máxima de produtos exibidos |
| `columns` | `2 \| 3 \| 4` | `3` | Número de colunas no grid |
| `borderRadius` | number | `8` | Bordas arredondadas em px |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem |
| `paddingTop/Right/Bottom/Left` | `number` | `0` | Padding |

**Seleção de produtos**: no editor, clique em "+ Selecionar produtos" para abrir o modal de busca. Marque os produtos desejados e confirme. Os IDs são salvos em `productIds`.

```json
{
  "type": "ProductGrid",
  "props": { "title": "Mais vendidos", "productIds": [1, 3, 5, 7], "limit": 4, "columns": 4, "borderRadius": 8 },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```
```

---

### CustomHtml — HTML personalizado

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `html` | string | `""` | Código HTML arbitrário |
| `marginTop/Right/Bottom/Left` | `number \| "auto"` | `0` | Margem (padding não disponível) |

```json
{
  "type": "CustomHtml",
  "props": { "html": "<div style='padding:20px;background:#f0f0f0;'>Conteúdo customizado</div>" },
  "parent": "ROOT",
  "nodes": [],
  "isCanvas": false
}
```

---

## Componentes internos (não usar diretamente)

Estes são usados apenas como containers por outros componentes:

### ColumnCell — Célula de coluna/container

Container canvas genérico. Usado internamente por Columns e Container. Não coloque diretamente na página.

| Prop | Tipo | Default |
|------|------|---------|
| (nenhuma) | — | — |

### RootContainer — Raiz da página

Usado apenas como `"ROOT"`. Não usar em outros lugares.

---

## Exemplo completo: Landing Page

```json
{
  "ROOT": {
    "type": "RootContainer",
    "displayName": "RootContainer",
    "props": {},
    "parent": null,
    "nodes": ["banner_1", "spacer_1", "title_1", "cols_1"],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": true
  },
  "banner_1": {
    "type": "Banner",
    "displayName": "Banner",
    "props": {
      "imageSrc": "https://placehold.co/1200x400/1e3a5f/ffffff?text=Banner",
      "title": "Bem-vindo à Alura",
      "subtitle": "Sua plataforma de e-commerce",
      "buttonLabel": "Ver produtos",
      "buttonHref": "/produtos",
      "overlayOpacity": 40,
      "height": 400,
      "textColor": "#ffffff",
      "borderRadius": 0
    },
    "parent": "ROOT",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "spacer_1": {
    "type": "Spacer",
    "displayName": "Spacer",
    "props": { "height": 40 },
    "parent": "ROOT",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "title_1": {
    "type": "Title",
    "displayName": "Title",
    "props": { "text": "Nossos Produtos", "level": "h2", "align": "center", "color": "#111827" },
    "parent": "ROOT",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "cols_1": {
    "type": "Columns",
    "displayName": "Columns",
    "props": { "columns": 3, "gap": 16, "borderRadius": 8 },
    "parent": "ROOT",
    "nodes": [],
    "linkedNodes": {
      "cols_1-col-0": "cell_a",
      "cols_1-col-1": "cell_b",
      "cols_1-col-2": "cell_c"
    },
    "hidden": false,
    "isCanvas": false
  },
  "cell_a": {
    "type": "ColumnCell",
    "displayName": "ColumnCell",
    "props": {},
    "parent": "cols_1",
    "nodes": ["img_a", "text_a"],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": true
  },
  "img_a": {
    "type": "ImageBlock",
    "displayName": "ImageBlock",
    "props": { "src": "https://placehold.co/400x300/e5e7eb/6b7280?text=Produto+1", "alt": "Produto 1", "borderRadius": 8 },
    "parent": "cell_a",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "text_a": {
    "type": "TextBlock",
    "displayName": "TextBlock",
    "props": { "content": "<p style='text-align:center'>Produto premium com qualidade excepcional.</p>", "fontSize": 14, "color": "#6b7280", "textAlign": "center" },
    "parent": "cell_a",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "cell_b": {
    "type": "ColumnCell",
    "displayName": "ColumnCell",
    "props": {},
    "parent": "cols_1",
    "nodes": ["img_b", "text_b"],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": true
  },
  "img_b": {
    "type": "ImageBlock",
    "displayName": "ImageBlock",
    "props": { "src": "https://placehold.co/400x300/e5e7eb/6b7280?text=Produto+2", "alt": "Produto 2", "borderRadius": 8 },
    "parent": "cell_b",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "text_b": {
    "type": "TextBlock",
    "displayName": "TextBlock",
    "props": { "content": "<p style='text-align:center'>Design moderno e funcional.</p>", "fontSize": 14, "color": "#6b7280", "textAlign": "center" },
    "parent": "cell_b",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "cell_c": {
    "type": "ColumnCell",
    "displayName": "ColumnCell",
    "props": {},
    "parent": "cols_1",
    "nodes": ["img_c", "text_c"],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": true
  },
  "img_c": {
    "type": "ImageBlock",
    "displayName": "ImageBlock",
    "props": { "src": "https://placehold.co/400x300/e5e7eb/6b7280?text=Produto+3", "alt": "Produto 3", "borderRadius": 8 },
    "parent": "cell_c",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  },
  "text_c": {
    "type": "TextBlock",
    "displayName": "TextBlock",
    "props": { "content": "<p style='text-align:center'>O favorito dos nossos clientes.</p>", "fontSize": 14, "color": "#6b7280", "textAlign": "center" },
    "parent": "cell_c",
    "nodes": [],
    "linkedNodes": {},
    "hidden": false,
    "isCanvas": false
  }
}
```

---

## Regras para geração de JSON

1. **IDs únicos**: cada nó precisa de um ID único (ex: `"text_1"`, `"banner_home"`, `"cols_main"`). Use prefixos descritivos
2. **Todo nó tem `parent`**: exceto ROOT que tem `parent: null`
3. **ROOT sempre presente**: é o ponto de entrada, seu `nodes` lista os componentes visíveis
4. **linkedNodes**: Columns e Container usam `linkedNodes` para referenciar filhos internos. O valor de cada chave é o ID real do nó filho
5. **`nodes` vs `linkedNodes`**: `nodes` = filhos diretos normais. `linkedNodes` = filhos criados via `<Element id="...">` . Ambos precisam existir como nós separados
6. **isCanvas**: `true` para RootContainer e ColumnCell. `false` para todos os outros
7. **displayName**: use o mesmo valor do `type` para consistência
8. **Espaçamento**: todos os componentes de conteúdo aceitam `marginTop`, `marginRight`, `marginBottom`, `marginLeft` (número em px ou `"auto"`) e `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` (número em px). Exceções: ButtonBlock, Spacer e CustomHtml só aceitam margin. ColumnCell e RootContainer não aceitam nenhum.
