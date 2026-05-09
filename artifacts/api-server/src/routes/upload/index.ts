import { Router, type IRouter } from "express";
import path from "path";
import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";
import { UploadImageBody, UploadImageResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  projectId: "",
});

function getBucketAndDir(): { bucketName: string; privateDir: string } {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
  const parts = dir.replace(/^\//, "").split("/");
  const bucketName = parts[0];
  const privateDir = parts.slice(1).join("/");
  return { bucketName, privateDir };
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

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const ext = path.extname(filename) || ".jpg";
  const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;

  try {
    const { bucketName, privateDir } = getBucketAndDir();
    const objectName = `${privateDir}/uploads/${uniqueName}`;
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(buffer, {
      contentType,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    const url = `/api/uploads/${uniqueName}`;
    res.json(UploadImageResponse.parse({ url }));
  } catch (err) {
    console.error("Upload to object storage failed:", err);
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
    const { bucketName, privateDir } = getBucketAndDir();
    const objectName = `${privateDir}/uploads/${filename}`;
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    file.createReadStream().pipe(res);
  } catch (err) {
    console.error("Failed to serve image from object storage:", err);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

export default router;
