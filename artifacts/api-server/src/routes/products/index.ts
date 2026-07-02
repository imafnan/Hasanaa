import { Router, type IRouter } from "express";
import { CategoryModel, SubcategoryModel, ProductModel, getNextSequenceValue } from "@workspace/db";
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
  p: any,
  categoryName?: string | null,
  subcategoryName?: string | null,
  variants: Array<{ id: number; name: string; imageUrl: string | null; price: string; colors: string[] }> = [],
) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : null,
    imageUrl: p.imageUrl ?? null,
    images: p.images ?? [],
    sizeChartUrl: p.sizeChartUrl ?? null,
    variantIds: p.variantIds ?? [],
    variants,
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

async function fetchVariants(variantIds: number[]) {
  if (!variantIds || variantIds.length === 0) return [];
  const rows = await ProductModel.find({ id: { $in: variantIds } });
  return rows.map(v => ({
    id: v.id,
    name: v.name,
    imageUrl: v.imageUrl ?? null,
    price: String(v.price),
    colors: v.colors ?? [],
  }));
}

router.get("/products", async (req, res): Promise<void> => {
  const queryParams = ListProductsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { categoryId, subcategoryId, featured } = queryParams.data as any;

  const query: Record<string, any> = {};
  if (categoryId != null) query.categoryId = Number(categoryId);
  if (subcategoryId != null) query.subcategoryId = Number(subcategoryId);
  if (featured === "true") query.isFeatured = true;

  const products = await ProductModel.find(query).sort({ createdAt: 1 });

  // Bulk look up categories and subcategories
  const catIds = Array.from(new Set(products.map(p => p.categoryId).filter(Boolean)));
  const subcatIds = Array.from(new Set(products.map(p => p.subcategoryId).filter(Boolean)));

  const [categories, subcategories] = await Promise.all([
    CategoryModel.find({ id: { $in: catIds } }),
    SubcategoryModel.find({ id: { $in: subcatIds } }),
  ]);

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const subcategoryMap = new Map(subcategories.map(s => [s.id, s.name]));

  res.json(ListProductsResponse.parse(products.map(p =>
    formatProduct(
      p,
      p.categoryId ? categoryMap.get(p.categoryId) : null,
      p.subcategoryId ? subcategoryMap.get(p.subcategoryId) : null,
      []
    )
  )));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nextId = await getNextSequenceValue("Product");
  const product = await ProductModel.create({
    id: nextId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parseFloat(parsed.data.price),
    originalPrice: parsed.data.originalPrice ? parseFloat(parsed.data.originalPrice) : null,
    imageUrl: parsed.data.imageUrl ?? null,
    images: parsed.data.images ?? [],
    sizeChartUrl: (parsed.data as any).sizeChartUrl ?? null,
    variantIds: (parsed.data as any).variantIds ?? [],
    categoryId: parsed.data.categoryId ?? null,
    subcategoryId: (parsed.data as any).subcategoryId ?? null,
    inStock: parsed.data.inStock ?? true,
    isFeatured: parsed.data.isFeatured ?? false,
    sizes: parsed.data.sizes ?? [],
    colors: parsed.data.colors ?? [],
  });

  let categoryName: string | null = null;
  let subcategoryName: string | null = null;

  if (product.categoryId) {
    const cat = await CategoryModel.findOne({ id: product.categoryId });
    categoryName = cat?.name ?? null;
  }
  if (product.subcategoryId) {
    const sub = await SubcategoryModel.findOne({ id: product.subcategoryId });
    subcategoryName = sub?.name ?? null;
  }
  const variants = await fetchVariants(product.variantIds ?? []);

  res.status(201).json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName, variants)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await ProductModel.findOne({ id: params.data.id });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  let categoryName: string | null = null;
  let subcategoryName: string | null = null;

  if (product.categoryId) {
    const cat = await CategoryModel.findOne({ id: product.categoryId });
    categoryName = cat?.name ?? null;
  }
  if (product.subcategoryId) {
    const sub = await SubcategoryModel.findOne({ id: product.subcategoryId });
    subcategoryName = sub?.name ?? null;
  }

  const variants = await fetchVariants(product.variantIds ?? []);
  res.json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName, variants)));
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

  const updateData: Record<string, any> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price != null) updateData.price = parseFloat(parsed.data.price);
  if (parsed.data.originalPrice !== undefined) updateData.originalPrice = parsed.data.originalPrice ? parseFloat(parsed.data.originalPrice) : null;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.images != null) updateData.images = parsed.data.images;
  if ((parsed.data as any).sizeChartUrl !== undefined) updateData.sizeChartUrl = (parsed.data as any).sizeChartUrl;
  if ((parsed.data as any).variantIds != null) updateData.variantIds = (parsed.data as any).variantIds;
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
  if ((parsed.data as any).subcategoryId !== undefined) updateData.subcategoryId = (parsed.data as any).subcategoryId;
  if (parsed.data.inStock != null) updateData.inStock = parsed.data.inStock;
  if (parsed.data.isFeatured != null) updateData.isFeatured = parsed.data.isFeatured;
  if (parsed.data.sizes != null) updateData.sizes = parsed.data.sizes;
  if (parsed.data.colors != null) updateData.colors = parsed.data.colors;

  const product = await ProductModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: updateData },
    { new: true }
  );

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  let categoryName: string | null = null;
  let subcategoryName: string | null = null;

  if (product.categoryId) {
    const cat = await CategoryModel.findOne({ id: product.categoryId });
    categoryName = cat?.name ?? null;
  }
  if (product.subcategoryId) {
    const sub = await SubcategoryModel.findOne({ id: product.subcategoryId });
    subcategoryName = sub?.name ?? null;
  }
  const variants = await fetchVariants(product.variantIds ?? []);

  res.json(GetProductResponse.parse(formatProduct(product, categoryName, subcategoryName, variants)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await ProductModel.findOneAndDelete({ id: params.data.id });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
