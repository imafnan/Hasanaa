import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, promotionsTable } from "@workspace/db";
import {
  CreatePromotionBody,
  UpdatePromotionBody,
  GetPromotionParams,
  UpdatePromotionParams,
  DeletePromotionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatPromotion(p: typeof promotionsTable.$inferSelect) {
  return {
    ...p,
    items: (p.items as any[]) ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/promotions", async (_req, res): Promise<void> => {
  const promotions = await db.select().from(promotionsTable).orderBy(promotionsTable.sortOrder, promotionsTable.createdAt);
  res.json(promotions.map(formatPromotion));
});

router.post("/promotions", async (req, res): Promise<void> => {
  const parsed = CreatePromotionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [promo] = await db.insert(promotionsTable).values({
    title: parsed.data.title,
    gridType: parsed.data.gridType,
    position: parsed.data.position,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
    items: (parsed.data.items ?? []) as any,
  }).returning();

  res.status(201).json(formatPromotion(promo));
});

router.get("/promotions/:id", async (req, res): Promise<void> => {
  const params = GetPromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [promo] = await db.select().from(promotionsTable).where(eq(promotionsTable.id, params.data.id));
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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.gridType != null) updateData.gridType = parsed.data.gridType;
  if (parsed.data.position != null) updateData.position = parsed.data.position;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;
  if (parsed.data.items !== undefined) updateData.items = parsed.data.items as any;

  const [promo] = await db.update(promotionsTable).set(updateData).where(eq(promotionsTable.id, params.data.id)).returning();
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

  const [promo] = await db.delete(promotionsTable).where(eq(promotionsTable.id, params.data.id)).returning();
  if (!promo) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
