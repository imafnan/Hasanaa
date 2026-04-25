# Hasanaa E-Commerce Store

## Overview

Full-stack e-commerce web application for **Hasanaa** — a traditional Islamic clothing brand (similar to sunnahbd.com). Includes a customer-facing storefront and a full admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, React Query, Wouter routing
- **Sessions**: express-session (for admin auth)

## Artifacts

- `artifacts/api-server` — Express API server (routes, auth, products, categories, banners, orders)
- `artifacts/hasanaa` — React + Vite frontend (storefront + admin panel)

## Admin Credentials

- **Username**: admin
- **Password**: hasanaa2024
- **Admin URL**: `/admin/login`

## Features

### Customer Store
- Homepage with banner carousel, category grid, featured products
- Category browsing (Panjabi, Kabli, Hasaria, Sheikh, Thobe, Waist Coat, Katua, Assasiin, Al Mumtaza, Kids Panjabi, Kids Kabli, Accessories)
- Product detail with size/color selection
- Shopping cart (localStorage-based)
- Checkout with customer details → order placement
- Mobile responsive

### Admin Panel
- Secure login (admin/hasanaa2024)
- Dashboard with order statistics
- Banner management (CRUD with image upload)
- Category management (CRUD with image upload)
- Product management (CRUD with sizes, colors, images)
- Order management (view all orders, update status)

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Routes

- `GET/POST /api/banners` — banners list/create
- `GET/PATCH/DELETE /api/banners/:id` — banner operations
- `GET/POST /api/categories` — categories list/create
- `GET/PATCH/DELETE /api/categories/:id` — category operations (GET includes products)
- `GET/POST /api/products` — products list/create (supports ?categoryId=&featured=true)
- `GET/PATCH/DELETE /api/products/:id` — product operations
- `GET/POST /api/orders` — orders list/create
- `GET/PATCH /api/orders/:id` — order operations
- `GET /api/orders/stats` — dashboard stats
- `POST /api/auth/login` — admin login
- `POST /api/auth/logout` — admin logout
- `GET /api/auth/me` — check session
- `POST /api/upload/image` — image upload (base64)
