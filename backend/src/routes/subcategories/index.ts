import { Router, type IRouter } from "express";
import { CategoryModel, SubcategoryModel, ProductModel, getNextSequenceValue } from "@workspace/db";
import {
  CreateSubcategoryBody,
  UpdateSubcategoryBody,
  GetSubcategoryParams,
  UpdateSubcategoryParams,
  DeleteSubcategoryParams,
  ListSubcategoriesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatSubcategory(s: any) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    categoryId: s.categoryId,
    imageUrl: s.imageUrl ?? null,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/subcategories", async (req, res): Promise<void> => {
  const params = ListSubcategoriesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query: Record<string, any> = {};
  if (params.data.categoryId != null) {
    query.categoryId = params.data.categoryId;
  }

  const subs = await SubcategoryModel.find(query).sort({ sortOrder: 1, createdAt: 1 });
  res.json(subs.map(formatSubcategory));
});

router.post("/subcategories", async (req, res): Promise<void> => {
  const parsed = CreateSubcategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nextId = await getNextSequenceValue("Subcategory");
  const sub = await SubcategoryModel.create({
    id: nextId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    categoryId: parsed.data.categoryId,
    imageUrl: parsed.data.imageUrl ?? null,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  });

  res.status(201).json(formatSubcategory(sub));
});

router.get("/subcategories/:id", async (req, res): Promise<void> => {
  const params = GetSubcategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sub = await SubcategoryModel.findOne({ id: params.data.id });
  if (!sub) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  const products = await ProductModel.find({ subcategoryId: sub.id });
  const cat = await CategoryModel.findOne({ id: sub.categoryId });

  res.json({
    ...formatSubcategory(sub),
    products: products.map(p => ({
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
      categoryName: cat?.name ?? null,
      subcategoryId: p.subcategoryId ?? null,
      subcategoryName: sub.name,
      inStock: p.inStock,
      isFeatured: p.isFeatured,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
});

router.patch("/subcategories/:id", async (req, res): Promise<void> => {
  const params = UpdateSubcategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubcategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.slug != null) updateData.slug = parsed.data.slug;
  if (parsed.data.categoryId != null) updateData.categoryId = parsed.data.categoryId;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;

  const sub = await SubcategoryModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: updateData },
    { new: true }
  );

  if (!sub) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  res.json(formatSubcategory(sub));
});

router.delete("/subcategories/:id", async (req, res): Promise<void> => {
  const params = DeleteSubcategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sub = await SubcategoryModel.findOneAndDelete({ id: params.data.id });
  if (!sub) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
