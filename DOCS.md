# Documentação do Sistema: Catálogo SaaS Multi-Tenant

## 1. Arquitetura do Sistema

O sistema é uma plataforma **SaaS Multi-Tenant** baseada em uma arquitetura de **Single Page Application (SPA)** com um **Backend Full-Stack** para processamento de regras de negócio e integração.

### Componentes:
- **Frontend**: React 18 com Vite, Tailwind CSS para estilização e Framer Motion para animações.
- **Backend**: Node.js com Express, servindo APIs REST e gerenciando a resolução de tenants (lojas).
- **Banco de Dados**: Firebase Firestore (NoSQL), ideal para escalabilidade e atualizações em tempo real.
- **Autenticação**: Firebase Authentication (Suporte a Email/Senha e Google).
- **Storage**: Firebase Storage para armazenamento de imagens de produtos e banners.
- **Multi-tenancy**: Implementado via rotas dinâmicas no frontend (`/store/:slug`) e filtros de consulta no backend/firestore.

---

## 2. Modelagem do Banco de Dados (Firestore)

### Entidades Principais:

#### `users` (Coleção)
- `uid`: string (PK)
- `email`: string
- `role`: enum ('admin', 'reseller')
- `status`: enum ('active', 'inactive')
- `createdAt`: timestamp

#### `niches` (Coleção)
- `id`: string (PK)
- `name`: string
- `description`: string
- `image`: string (URL)
- `status`: boolean

#### `catalogs` (Coleção)
- `id`: string (PK)
- `nicheId`: string (FK)
- `name`: string
- `description`: string
- `coverImage`: string (URL)
- `status`: boolean

#### `products` (Coleção)
- `id`: string (PK)
- `nicheId`: string (FK)
- `catalogId`: string (FK)
- `categoryId`: string (FK)
- `name`: string
- `description`: string
- `sku`: string
- `images`: array<string>
- `basePrice`: number
- `variations`: array<{ name: string, options: array<string> }>
- `status`: boolean

#### `resellers` (Coleção)
- `uid`: string (PK)
- `name`: string
- `email`: string
- `phone`: string
- `storeName`: string
- `slug`: string (Unique Index)
- `nicheId`: string (FK)
- `status`: enum ('active', 'inactive')
- `settings`: {
    logo: string,
    banner: string,
    primaryColor: string,
    secondaryColor: string,
    description: string,
    whatsapp: string,
    instagram: string
  }

#### `reseller_products` (Coleção)
- `id`: string (resellerId + "_" + productId)
- `resellerId`: string (FK)
- `productId`: string (FK)
- `customName`: string
- `customDescription`: string
- `customPrice`: number
- `status`: boolean
- `stock`: number (opcional)

#### `orders` (Coleção)
- `id`: string (PK)
- `resellerId`: string (FK)
- `customerName`: string
- `customerPhone`: string
- `observations`: string
- `total`: number
- `status`: enum ('pending', 'confirmed', 'shipped', 'cancelled')
- `createdAt`: timestamp
- `items`: array<{
    productId: string,
    name: string,
    price: number,
    quantity: number,
    variation: string
  }>

---

## 3. Estrutura de APIs (Express)

### Públicas (`/api/public`)
- `GET /store/:slug`: Retorna dados da loja e produtos ativos do revendedor.
- `POST /order`: Registra o pedido e gera o link do WhatsApp.

### Revendedor (`/api/reseller`) - *Requer Auth*
- `GET /dashboard`: Estatísticas simples (pedidos, produtos ativos).
- `PATCH /settings`: Atualiza cores, logo e banner da loja.
- `GET /catalogs`: Lista catálogos disponíveis no nicho do revendedor.
- `POST /catalogs/toggle`: Ativa ou desativa um catálogo inteiro.
- `PATCH /product/:id`: Define preço e descrição customizada.
- `GET /orders`: Lista pedidos recebidos.

### Administrador (`/api/admin`) - *Requer Auth Admin*
- `POST /niches`: Cria novos nichos.
- `POST /catalogs`: Cria catálogos.
- `POST /products`: Cadastra produtos base.
- `GET /resellers`: Gerencia status dos revendedores.
- `GET /all-orders`: Visão global de vendas.

---

## 4. Fluxos do Sistema

### Fluxo de Criação de Pedido:
1. Cliente acessa `plataforma.com/lojadojoao`.
2. Adiciona produtos ao carrinho (armazenado em LocalStorage/State).
3. Preenche formulário de checkout (Nome, Telefone).
4. Sistema salva pedido no Firestore.
5. Sistema gera link: `https://wa.me/55.../?text=Olá...`.
6. Cliente é redirecionado para o WhatsApp.

### Fluxo de Ativação de Catálogo:
1. Revendedor acessa "Meus Catálogos".
2. Seleciona um catálogo do administrador.
3. O sistema cria automaticamente entradas em `reseller_products` para todos os produtos daquele catálogo com o `basePrice` inicial.

---

## 5. Estrutura de Pastas do Projeto

```text
/
├── server.ts              # Entry point do Backend (Express + Vite Middleware)
├── firebase.ts            # Configuração do Firebase SDK
├── firebase-blueprint.json # Definição das entidades (IR)
├── firestore.rules        # Regras de segurança do banco
├── src/
│   ├── main.tsx           # Entry point do React
│   ├── App.tsx            # Roteamento principal
│   ├── components/        # Componentes reutilizáveis (Button, Card, Navbar)
│   │   ├── admin/         # Componentes específicos do Admin
│   │   ├── reseller/      # Componentes específicos do Revendedor
│   │   └── store/         # Componentes da Loja Pública
│   ├── pages/             # Páginas completas
│   │   ├── AdminDashboard.tsx
│   │   ├── ResellerPanel.tsx
│   │   └── PublicStore.tsx
│   ├── services/          # Chamadas de API e Firebase
│   ├── hooks/             # Custom hooks (useAuth, useCart)
│   ├── types/             # Definições TypeScript
│   └── lib/               # Utilitários (utils.ts, constants.ts)
└── public/                # Assets estáticos
```

---

## 6. Tecnologias Recomendadas

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion.
- **Backend**: Node.js + Express + Firebase Admin SDK.
- **Banco de Dados**: Google Cloud Firestore.
- **Autenticação**: Firebase Auth.
- **Hospedagem**: Google Cloud Run (Dockerizada).
- **Imagens**: Firebase Storage ou Cloudinary.
- **WhatsApp**: API de link direto (`wa.me`).

---

## 7. MVP (Produto Mínimo Viável)

O MVP foca na jornada completa:
1. Admin cadastra 1 nicho e 1 catálogo com 5 produtos.
2. Revendedor se cadastra, escolhe o nicho e define preços.
3. Loja pública é gerada automaticamente.
4. Cliente faz pedido e o revendedor recebe no WhatsApp.
