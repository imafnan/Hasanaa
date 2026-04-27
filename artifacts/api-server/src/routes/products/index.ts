import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, categoriesTable, subcategoriesTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
  ListProductsResponse,
  GetProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(
  p: typeof productsTable.$inferSelect,
  categoryName?: string | null,
  subcategoryName?: string | null,
) {
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

router.get("/products", async (req, res): Promise<void> => {
  const queryParams = ListProductsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { categoryId, subcategoryId, featured } = queryParams.data as any;

  const conditions = [];
  if (categoryId != null) conditions.push(eq(productsTable.categoryId, Number(categoryId)));
  if (subcategoryId != null) conditions.push(eq(productsTable.subcategoryId, Number(subcategoryId)));
  if (featured === "true") conditions.push(eq(productsTable.isFeatured, true));

  const products = conditions.length > 0
    ? await db.select({ product: productsTable, categoryName: categoriesTable.name, subcategoryName: subcategoriesTable.name })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .leftJoin(subcategoriesTable, eq(productsTable.subcategoryId, subcategoriesTable.id))
        .where(and(...conditions))
        .orderBy(productsTable.createdAt)
    : await db.select({ product: productsTable, categoryName: categoriesTable.name, subcategoryName: subcategoriesTable.name })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .leftJoin(subcategoriesTable, eq(productsTable.subcategoryId, subcategoriesTable.id))
        .orderBy(productsTable.createdAt);

  res.json(ListProductsResponse.parse(products.map(({ product, categoryName, subcategoryName }) =>
    formatProduct(product, categoryName, subcategoryName)
  )));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    originalPrice: parsed.data.originalPrice ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    images: parsed.data.images ?? [],
    categoryId: parsed.data.categoryId ?? null,
    subcategoryId: (parsed.data as any).subcategoryId ?? null,
    inStock: parsed.data.inStock ?? true,
    isFeatured: parsed.data.isFeatured ?? false,
    sizes: parsed.data.sizes ?? [],
    colors: parsed.data.colors ?? [],
  }).returning();

  let categoryName: string | null = null;
  let subcategoryName: string | null = null;
  if (product.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
    categoryName = cat?.name ?? null;
  }
  if (product.subcategoryId) {
    const [sub] = await db.select().from(subcategoriesTable).where(eq(subcategoriesTable.id, product.subcategoryId));
    subcategoryName = sub?.name ?? null;
  }

  res.status(201).json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await db.select({ product: productsTable, categoryName: categoriesTable.name, subcategoryName: subcategoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(subcategoriesTable, eq(productsTable.subcategoryId, subcategoriesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (result.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const { product, categoryName, subcategoryName } = result[0];
  res.json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price != null) updateData.price = parsed.data.price;
  if (parsed.data.originalPrice !== undefined) updateData.originalPrice = parsed.data.originalPrice;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.images != null) updateData.images = parsed.data.images;
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
  if ((parsed.data as any).subcategoryId !== undefined) updateData.subcategoryId = (parsed.data as any).subcategoryId;
  if (parsed.data.inStock != null) updateData.inStock = parsed.data.inStock;
  if (parsed.data.isFeatured != null) updateData.isFeatured = parsed.data.isFeatured;
  if (parsed.data.sizes != null) updateData.sizes = parsed.data.sizes;
  if (parsed.data.colors != null) updateData.colors = parsed.data.colors;

  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  let categoryName: string | null = null;
  let subcategoryName: string | null = null;
  if (product.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
    categoryName = cat?.name ?? null;
  }
  if (product.subcategoryId) {
    const [sub] = await db.select().from(subcategoriesTable).where(eq(subcategoriesTable.id, product.subcategoryId));
    subcategoryName = sub?.name ?? null;
  }

  res.json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
