import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import {
  CreateBannerBody,
  UpdateBannerBody,
  GetBannerParams,
  UpdateBannerParams,
  DeleteBannerParams,
  ListBannersResponse,
  GetBannerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db
    .select()
    .from(bannersTable)
    .orderBy(bannersTable.sortOrder, bannersTable.createdAt);
  res.json(ListBannersResponse.parse(banners.map(b => ({
    ...b,
    subtitle: b.subtitle ?? null,
    linkUrl: b.linkUrl ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))));
});

router.post("/banners", async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [banner] = await db.insert(bannersTable).values({
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    imageUrl: parsed.data.imageUrl,
    linkUrl: parsed.data.linkUrl ?? null,
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();

  res.status(201).json(GetBannerResponse.parse({
    ...banner,
    subtitle: banner.subtitle ?? null,
    linkUrl: banner.linkUrl ?? null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  }));
});

router.get("/banners/:id", async (req, res): Promise<void> => {
  const params = GetBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [banner] = await db.select().from(bannersTable).where(eq(bannersTable.id, params.data.id));
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.json(GetBannerResponse.parse({
    ...banner,
    subtitle: banner.subtitle ?? null,
    linkUrl: banner.linkUrl ?? null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  }));
});

router.patch("/banners/:id", async (req, res): Promise<void> => {
  const params = UpdateBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.subtitle !== undefined) updateData.subtitle = parsed.data.subtitle;
  if (parsed.data.imageUrl != null) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.linkUrl !== undefined) updateData.linkUrl = parsed.data.linkUrl;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;

  const [banner] = await db.update(bannersTable).set(updateData).where(eq(bannersTable.id, params.data.id)).returning();
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.json(GetBannerResponse.parse({
    ...banner,
    subtitle: banner.subtitle ?? null,
    linkUrl: banner.linkUrl ?? null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  }));
});

router.delete("/banners/:id", async (req, res): Promise<void> => {
  const params = DeleteBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [banner] = await db.delete(bannersTable).where(eq(bannersTable.id, params.data.id)).returning();
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
