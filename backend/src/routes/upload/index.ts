import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { UploadImageBody, UploadImageResponse } from "@workspace/api-zod";
import { storageService } from "../../lib/storage";

const router: IRouter = Router();

router.post("/upload/image", async (req, res): Promise<void> => {
  const parsed = UploadImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, filename } = parsed.data;

  try {
    const url = await storageService.uploadImage(data, filename);
    res.json(UploadImageResponse.parse({ url }));
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/uploads/:filename", async (req, res): Promise<void> => {
  const { filename } = req.params;

  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  try {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    const searchPaths = [
      path.join(uploadsDir, filename),
      path.join(uploadsDir, "images", filename),
      path.join(uploadsDir, "videos", filename),
      path.join(uploadsDir, "files", filename),
    ];

    for (const filePath of searchPaths) {
      if (fs.existsSync(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.sendFile(filePath);
        return;
      }
    }

    res.status(404).json({ error: "Image not found" });
  } catch (err) {
    console.error("Failed to serve image:", err);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

export default router;
