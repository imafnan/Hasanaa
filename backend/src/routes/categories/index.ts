import { Router, type IRouter } from "express";
import { CategoryModel, SubcategoryModel, ProductModel, getNextSequenceValue } from "@workspace/db";
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

function formatCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl ?? null,
    parentTag: c.parentTag ?? null,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatProduct(p: any, categoryName?: string | null, subcategoryName?: string | null) {
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
    variants: [],
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
  const cats = await CategoryModel.find({}).sort({ sortOrder: 1, createdAt: 1 });
  res.json(ListCategoriesResponse.parse(cats.map(formatCategory)));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nextId = await getNextSequenceValue("Category");
  const cat = await CategoryModel.create({
    id: nextId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    imageUrl: parsed.data.imageUrl ?? null,
    parentTag: parsed.data.parentTag ?? null,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  });

  res.status(201).json(GetCategoryResponse.parse({ ...formatCategory(cat), subcategories: [], products: [] }));
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const cat = await CategoryModel.findOne({ id: params.data.id });
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [subcategories, products] = await Promise.all([
    SubcategoryModel.find({ categoryId: cat.id }).sort({ sortOrder: 1, createdAt: 1 }),
    ProductModel.find({ categoryId: cat.id }).sort({ createdAt: 1 }),
  ]);

  res.json(GetCategoryResponse.parse({
    ...formatCategory(cat),
    subcategories: subcategories.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      categoryId: s.categoryId,
      imageUrl: s.imageUrl ?? null,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
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

  const updateData: Record<string, any> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.slug != null) updateData.slug = parsed.data.slug;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.parentTag !== undefined) updateData.parentTag = parsed.data.parentTag;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;

  const cat = await CategoryModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: updateData },
    { new: true }
  );

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

  const cat = await CategoryModel.findOneAndDelete({ id: params.data.id });
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
