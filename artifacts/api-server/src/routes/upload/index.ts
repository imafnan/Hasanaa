import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { UploadImageBody, UploadImageResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/upload/image", async (req, res): Promise<void> => {
  const parsed = UploadImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, filename } = parsed.data;

  const matches = data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    res.status(400).json({ error: "Invalid base64 image data" });
    return;
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const ext = path.extname(filename) || ".jpg";
  const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;

  try {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    const imagesDir = path.join(uploadsDir, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    const filePath = path.join(imagesDir, uniqueName);
    await fs.promises.writeFile(filePath, buffer);

    const url = `/api/uploads/images/${uniqueName}`;
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
