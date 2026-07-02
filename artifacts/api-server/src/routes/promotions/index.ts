import { Router, type IRouter } from "express";
import { PromotionModel, getNextSequenceValue } from "@workspace/db";
import {
  CreatePromotionBody,
  UpdatePromotionBody,
  GetPromotionParams,
  UpdatePromotionParams,
  DeletePromotionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatPromotion(p: any) {
  return {
    id: p.id,
    title: p.title,
    gridType: p.gridType,
    position: p.position,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    items: p.items ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/promotions", async (_req, res): Promise<void> => {
  const promotions = await PromotionModel.find({}).sort({ sortOrder: 1, createdAt: 1 });
  res.json(promotions.map(formatPromotion));
});

router.post("/promotions", async (req, res): Promise<void> => {
  const parsed = CreatePromotionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nextId = await getNextSequenceValue("Promotion");
  const promo = await PromotionModel.create({
    id: nextId,
    title: parsed.data.title,
    gridType: parsed.data.gridType,
    position: parsed.data.position,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
    items: parsed.data.items ?? [],
  });

  res.status(201).json(formatPromotion(promo));
});

router.get("/promotions/:id", async (req, res): Promise<void> => {
  const params = GetPromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const promo = await PromotionModel.findOne({ id: params.data.id });
  if (!promo) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }

  res.json(formatPromotion(promo));
});

router.patch("/promotions/:id", async (req, res): Promise<void> => {
  const params = UpdatePromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePromotionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.gridType != null) updateData.gridType = parsed.data.gridType;
  if (parsed.data.position != null) updateData.position = parsed.data.position;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;
  if (parsed.data.items !== undefined) updateData.items = parsed.data.items;

  const promo = await PromotionModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: updateData },
    { new: true }
  );

  if (!promo) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }

  res.json(formatPromotion(promo));
});

router.delete("/promotions/:id", async (req, res): Promise<void> => {
  const params = DeletePromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const promo = await PromotionModel.findOneAndDelete({ id: params.data.id });
  if (!promo) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
