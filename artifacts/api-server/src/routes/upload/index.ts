import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import { UploadImageBody, UploadImageResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const ext = path.extname(filename) || ".jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  fs.writeFileSync(filePath, buffer);

  const url = `/api/uploads/${uniqueName}`;
  res.json(UploadImageResponse.parse({ url }));
});

export default router;
