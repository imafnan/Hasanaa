import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  images: text("images").array().notNull().default([]),
  sizeChartUrl: text("size_chart_url"),
  variantIds: integer("variant_ids").array().notNull().default([]),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  subcategoryId: integer("subcategory_id"),
  inStock: boolean("in_stock").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  sizes: text("sizes").array().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
