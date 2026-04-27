import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable, productsTable, subcategoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  GetCategoryParams,
  UpdateCategoryParams,
  DeleteCategoryParams,
  ListCategoriesResponse,
  GetCategoryResponse,
  UpdateCategoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return {
    ...c,
    imageUrl: c.imageUrl ?? null,
    parentTag: c.parentTag ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null, subcategoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : null,
    imageUrl: p.imageUrl ?? null,
    images: p.images ?? [],
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    subcategoryId: p.subcategoryId ?? null,
    subcategoryName: subcategoryName ?? null,
    inStock: p.inStock,
    isFeatured: p.isFeatured,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder, categoriesTable.createdAt);
  res.json(ListCategoriesResponse.parse(cats.map(formatCategory)));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db.insert(categoriesTable).values({
    name: parsed.data.name,
    slug: parsed.data.slug,
    imageUrl: parsed.data.imageUrl ?? null,
    parentTag: parsed.data.parentTag ?? null,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();

  res.status(201).json(GetCategoryResponse.parse({ ...formatCategory(cat), subcategories: [], products: [] }));
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [subcategories, products] = await Promise.all([
    db.select().from(subcategoriesTable).where(eq(subcategoriesTable.categoryId, cat.id)).orderBy(subcategoriesTable.sortOrder),
    db.select().from(productsTable).where(eq(productsTable.categoryId, cat.id)),
  ]);

  res.json(GetCategoryResponse.parse({
    ...formatCategory(cat),
    subcategories: subcategories.map(s => ({
      ...s,
      imageUrl: s.imageUrl ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    products: products.map(p => formatProduct(p, cat.name)),
  }));
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.slug != null) updateData.slug = parsed.data.slug;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.parentTag !== undefined) updateData.parentTag = parsed.data.parentTag;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;

  const [cat] = await db.update(categoriesTable).set(updateData).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(UpdateCategoryResponse.parse(formatCategory(cat)));
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cat] = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
