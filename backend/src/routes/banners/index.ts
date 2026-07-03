import { Router, type IRouter } from "express";
import { BannerModel, getNextSequenceValue } from "@workspace/db";
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

function formatBanner(b: any) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle ?? null,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl ?? null,
    categoryId: b.categoryId ?? null,
    subcategoryId: b.subcategoryId ?? null,
    position: b.position ?? "top",
    isActive: b.isActive,
    sortOrder: b.sortOrder,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await BannerModel.find({}).sort({ sortOrder: 1, createdAt: 1 });
  res.json(ListBannersResponse.parse(banners.map(formatBanner)));
});

router.post("/banners", async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nextId = await getNextSequenceValue("Banner");
  const banner = await BannerModel.create({
    id: nextId,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    imageUrl: parsed.data.imageUrl,
    linkUrl: parsed.data.linkUrl ?? null,
    categoryId: (parsed.data as any).categoryId ?? null,
    subcategoryId: (parsed.data as any).subcategoryId ?? null,
    position: (parsed.data as any).position ?? "top",
    isActive: parsed.data.isActive ?? true,
    sortOrder: parsed.data.sortOrder ?? 0,
  });

  res.status(201).json(GetBannerResponse.parse(formatBanner(banner)));
});

router.get("/banners/:id", async (req, res): Promise<void> => {
  const params = GetBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const banner = await BannerModel.findOne({ id: params.data.id });
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.json(GetBannerResponse.parse(formatBanner(banner)));
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

  const updateData: Record<string, any> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.subtitle !== undefined) updateData.subtitle = parsed.data.subtitle;
  if (parsed.data.imageUrl != null) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.linkUrl !== undefined) updateData.linkUrl = parsed.data.linkUrl;
  if ((parsed.data as any).categoryId !== undefined) updateData.categoryId = (parsed.data as any).categoryId;
  if ((parsed.data as any).subcategoryId !== undefined) updateData.subcategoryId = (parsed.data as any).subcategoryId;
  if ((parsed.data as any).position != null) updateData.position = (parsed.data as any).position;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.sortOrder != null) updateData.sortOrder = parsed.data.sortOrder;

  const banner = await BannerModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: updateData },
    { new: true }
  );

  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.json(GetBannerResponse.parse(formatBanner(banner)));
});

router.delete("/banners/:id", async (req, res): Promise<void> => {
  const params = DeleteBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const banner = await BannerModel.findOneAndDelete({ id: params.data.id });
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
