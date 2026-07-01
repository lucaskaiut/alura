# Documento de Requisitos Funcionais

# Alura - Plataforma SaaS de E-commerce Multi-Tenant

## Versão 1.0

---

# 1. Visão Geral

O Alura é uma plataforma SaaS de comércio eletrônico multi-tenant que permite que múltiplas empresas criem e gerenciem suas lojas virtuais de forma independente.

Cada empresa possuirá seus próprios dados, configurações, catálogo, pedidos, clientes e conteúdos, sem compartilhamento de informações entre tenants.

O objetivo do MVP é disponibilizar uma solução completa para operação de lojas virtuais, incluindo catálogo de produtos, carrinho, checkout, pagamentos, frete, gestão de pedidos e construção visual de páginas.

---

# 2. Conceitos Gerais

## 2.1 Multi-Tenant

Cada empresa cadastrada na plataforma deverá possuir:

* Dados isolados das demais empresas
* Configurações próprias
* Produtos próprios
* Categorias próprias
* Clientes próprios
* Pedidos próprios
* Layout próprio
* Páginas próprias

Todas as entidades do sistema deverão pertencer a uma empresa.

---

# 3. Gestão de Empresas

## RF001 - Cadastro de Empresa

O sistema deverá permitir:

* Razão social
* Nome fantasia
* Documento fiscal
* E-mail
* Telefone
* Endereço
* Logo
* Domínio principal
* Subdomínio da plataforma

---

## RF002 - Configurações da Loja

A empresa poderá configurar:

* Nome da loja
* Descrição
* Logo
* Favicon
* Redes sociais
* Contatos
* Política de privacidade
* Termos de uso
* Política de troca

---

# 4. Gestão de Usuários Administrativos

## RF003 - Cadastro de Usuários

Permitir cadastro de usuários administrativos contendo:

* Nome
* E-mail
* Senha
* Status

---

## RF004 - Perfis de Acesso

Permitir criação de perfis:

* Administrador
* Gerente
* Operador

O sistema deverá permitir definir permissões por módulo.

---

# 5. Gestão de Categorias

## RF005 - Cadastro de Categorias

Permitir:

* Nome
* Descrição
* Imagem
* Categoria pai
* Status

---

## RF006 - Slug de Categoria

Toda categoria deverá possuir:

* Slug único por loja
* Geração automática baseada no nome
* Possibilidade de edição manual

Exemplos:

/camisetas

/eletronicos

/masculino/camisetas

---

# 6. Gestão de Marcas

## RF007 - Cadastro de Marcas

Permitir:

* Nome
* Logo
* Descrição
* Status

---

# 7. Gestão de Produtos

## RF008 - Cadastro de Produtos

Permitir:

* Nome
* Descrição curta
* Descrição completa
* SKU
* Código de barras
* Marca
* Categoria principal
* Categorias secundárias
* Peso
* Altura
* Largura
* Comprimento
* Status

---

## RF009 - Slug de Produto

Todo produto deverá possuir:

* Slug único por loja
* Geração automática
* Edição manual

Exemplo:

/camiseta-basica-preta

---

## RF010 - Imagens do Produto

Permitir:

* Múltiplas imagens
* Definir imagem principal
* Ordenação manual

---

## RF011 - Produto Simples

Permitir cadastro de produto sem variações.

---

## RF012 - Atributos

Permitir criação de atributos.

Exemplos:

* Cor
* Tamanho
* Voltagem
* Material

---

## RF013 - Valores de Atributos

Permitir valores para atributos.

Exemplos:

Cor:

* Preto
* Branco
* Azul

Tamanho:

* P
* M
* G
* GG

---

## RF014 - Produtos Variáveis

Permitir criação de produtos com combinações de atributos.

Exemplo:

Camiseta Básica

Cor:

* Preto
* Branco

Tamanho:

* P
* M
* G

Gerando:

* Preto P
* Preto M
* Preto G
* Branco P
* Branco M
* Branco G

---

## RF015 - Controle Individual das Variações

Cada variação deverá possuir:

* SKU próprio
* Código de barras próprio
* Estoque próprio
* Peso próprio
* Imagens próprias
* Preço próprio

---

# 8. Controle de Estoque

## RF016 - Estoque

Permitir:

* Quantidade disponível
* Quantidade reservada
* Quantidade mínima

---

## RF017 - Movimentações

Registrar:

* Entradas
* Saídas
* Ajustes

---

## RF018 - Histórico

Manter histórico completo de movimentações.

---

# 9. Gestão de Clientes

## RF019 - Cadastro de Clientes

Permitir:

* Nome
* Documento
* E-mail
* Telefone
* Data de nascimento

---

## RF020 - Endereços

Permitir múltiplos endereços por cliente.

---

# 10. Carrinho de Compras

## RF021 - Adição ao Carrinho

Permitir:

* Adicionar produtos
* Atualizar quantidades
* Remover produtos

---

## RF022 - Persistência

Manter carrinho salvo para clientes autenticados.

---

# 11. Checkout

## RF023 - Fluxo de Checkout

O checkout deverá permitir:

* Identificação do cliente
* Seleção de endereço
* Seleção de frete
* Seleção de pagamento
* Revisão do pedido

---

## RF024 - Compra como Visitante

Permitir checkout sem cadastro prévio.

---

# 12. Frete

## RF025 - Métodos de Frete

Permitir:

* Frete fixo
* Retirada na loja
* Transportadoras

---

## RF026 - Integrações de Frete

Permitir integração com:

* Correios
* Jadlog
* Outras transportadoras

---

## RF027 - Regras de Frete

Permitir:

* Frete grátis
* Faixa de CEP
* Faixa de peso
* Valor mínimo

---

# 13. Pagamentos

## RF028 - Métodos de Pagamento

Permitir:

* PIX
* Cartão de crédito
* Boleto

---

## RF029 - Gateways

Permitir integração com múltiplos gateways.

---

## RF030 - Webhooks

Receber notificações de pagamento.

---

## RF031 - Conciliação

Atualizar automaticamente o status dos pedidos.

---

# 14. Gestão de Pedidos

## RF032 - Criação de Pedido

Gerar pedido após conclusão do checkout.

---

## RF033 - Numeração

Todo pedido deverá possuir número sequencial único por loja.

---

## RF034 - Histórico

Registrar todas as alterações do pedido.

---

## RF035 - Linha do Tempo

Exibir timeline completa do pedido.

---

# 15. Status de Pedido

## RF036 - Status Configuráveis

Permitir criação e edição de status.

Exemplos:

* Aguardando pagamento
* Pago
* Em separação
* Faturado
* Enviado
* Entregue
* Cancelado
* Devolvido

---

## RF037 - Fluxo de Status

Permitir definir transições válidas entre status.

---

## RF038 - Automação

Permitir alteração automática por eventos de pagamento e envio.

---

# 16. Cupons de Desconto

## RF039 - Cupons

Permitir:

* Percentual
* Valor fixo
* Frete grátis

---

## RF040 - Restrições

Permitir:

* Período de validade
* Quantidade de usos
* Valor mínimo

---

# 17. CMS e Páginas

## RF041 - Cadastro de Páginas

Permitir:

* Título
* Conteúdo
* SEO
* Status

---

## RF042 - Slug de Página

Toda página deverá possuir slug único.

Exemplos:

/sobre-nos

/contato

/politica-de-trocas

---

# 18. Construtor Visual de Páginas

## RF043 - Editor Visual

Utilizar editor drag and drop baseado em CraftJS.

---

## RF044 - Componentes

Permitir:

* Texto
* Título
* Imagem
* Botão
* Banner
* Vídeo
* Espaçador
* Colunas
* Produtos
* Categorias
* Carrossel
* HTML personalizado

---

## RF045 - Estrutura Hierárquica

Permitir containers aninhados.

---

## RF046 - Responsividade

Permitir configuração para:

* Desktop
* Tablet
* Mobile

---

## RF047 - Templates

Permitir salvar páginas como templates reutilizáveis.

---

# 19. Home da Loja

## RF048 - Página Inicial

Permitir construção completa utilizando o editor visual.

---

# 20. SEO

## RF049 - SEO de Produtos

Permitir:

* Meta title
* Meta description
* URL amigável

---

## RF050 - SEO de Categorias

Permitir:

* Meta title
* Meta description

---

## RF051 - SEO de Páginas

Permitir:

* Meta title
* Meta description

---

# 21. Busca

## RF052 - Busca de Produtos

Permitir busca por:

* Nome
* SKU
* Código de barras

---

# 22. Relatórios

## RF053 - Dashboard

Exibir:

* Pedidos
* Faturamento
* Ticket médio
* Produtos vendidos

---

## RF054 - Relatórios

Permitir:

* Vendas por período
* Produtos mais vendidos
* Clientes com mais compras

---

# 23. Configurações de E-mail

## RF055 - Templates

Permitir personalização de e-mails.

---

## RF056 - Eventos

Enviar e-mails para:

* Pedido criado
* Pedido pago
* Pedido enviado
* Pedido cancelado

---

# 24. LGPD

## RF057 - Consentimento

Registrar aceite de termos.

---

## RF058 - Exclusão de Dados

Permitir anonimização de clientes.

---

# 25. Requisitos do MVP

O MVP deverá contemplar obrigatoriamente:

* Multi-tenant
* Gestão de empresas
* Gestão de usuários
* Produtos simples
* Produtos com variações
* Categorias
* Marcas
* Estoque
* Clientes
* Carrinho
* Checkout
* Frete
* Pagamento
* Pedidos
* Status configuráveis
* Cupons
* CMS
* Editor visual com CraftJS
* SEO
* Dashboard básico
* Templates de e-mail
* LGPD
