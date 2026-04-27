# Hasanaa E-Commerce Store

## Overview

Full-stack e-commerce web application for **Hasanaa** — a traditional Islamic clothing brand. Includes a customer-facing storefront and a full admin panel.

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

- `artifacts/api-server` — Express API server (routes, auth, products, categories, subcategories, banners, promotions, orders)
- `artifacts/hasanaa` — React + Vite frontend (storefront + admin panel)

## Admin Credentials

- **Username**: admin
- **Password**: hasanaa2024
- **Admin URL**: `/admin/login`

## Features

### Customer Store
- Homepage with hero banner carousel, promotion grid sections (2/4-grid), category grid, featured products
- Navbar with hover-dropdown showing subcategories per category
- Category browsing (`/category/:id`)
- Subcategory browsing (`/subcategory/:id`)
- Product detail with image gallery thumbnails, size/color selection, discount badge
- Shopping cart (localStorage-based)
- Checkout with customer details → order placement
- Mobile responsive with slide-out menu

### Admin Panel
- Secure login (admin/hasanaa2024)
- Dashboard with order statistics
- Banner management: CRUD with image upload, position (hero/mid/bottom), category/subcategory links
- Category management: CRUD with expandable subcategory rows (click chevron to expand)
- Subcategory management: inline within categories panel, create/edit/delete
- Product management: CRUD with category + subcategory selector, gallery images, in-stock toggle
- Promotions management: 2-grid or 4-grid promotion blocks with position (top/bottom), items with image + label + category/subcategory links
- Order management: view all orders, update status
- Image uploads: file upload only (drag-and-drop or click to upload), max 5MB

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

- `categories` — product categories
- `subcategories` — subcategories linked to categories (categoryId FK)
- `products` — products with categoryId + subcategoryId FK
- `banners` — hero/mid/bottom banners with position, categoryId, subcategoryId
- `promotions` — promotion grid blocks (gridType: 2|4, position: top|bottom, items: jsonb)
- `orders` + `order_items` — customer orders

## API Routes

- `GET/POST /api/banners` — banners list/create
- `GET/PATCH/DELETE /api/banners/:id` — banner operations
- `GET/POST /api/categories` — categories list/create (GET includes subcategories + products)
- `GET/PATCH/DELETE /api/categories/:id` — category operations
- `GET/POST /api/subcategories` — subcategories list/create (supports ?categoryId=)
- `GET/PATCH/DELETE /api/subcategories/:id` — subcategory operations (GET includes products)
- `GET/POST /api/products` — products list/create (supports ?categoryId=&subcategoryId=&featured=true)
- `GET/PATCH/DELETE /api/products/:id` — product operations
- `GET/POST /api/promotions` — promotions list/create
- `GET/PATCH/DELETE /api/promotions/:id` — promotion operations
- `GET/POST /api/orders` — orders list/create
- `GET/PATCH /api/orders/:id` — order operations
- `GET /api/orders/stats` — dashboard stats
- `POST /api/auth/login` — admin login
- `POST /api/auth/logout` — admin logout
- `GET /api/auth/me` — check session
- `POST /api/upload/image` — image upload (base64)
