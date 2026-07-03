import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

export interface IStorageService {
  uploadImage(base64Data: string, filename: string): Promise<string>;
}

class LocalStorageService implements IStorageService {
  async uploadImage(base64Data: string, filename: string): Promise<string> {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image data");
    }

    const contentType = matches[1];
    const dataPart = matches[2];
    const buffer = Buffer.from(dataPart, "base64");

    const ext = path.extname(filename) || ".jpg";
    const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    const imagesDir = path.join(uploadsDir, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    const filePath = path.join(imagesDir, uniqueName);
    await fs.promises.writeFile(filePath, buffer);

    return `/api/uploads/images/${uniqueName}`;
  }
}

class CloudinaryStorageService implements IStorageService {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.initialized = true;
  }

  async uploadImage(base64Data: string, filename: string): Promise<string> {
    this.init();
    const res = await cloudinary.uploader.upload(base64Data, {
      folder: "hasanaa",
    });
    return res.secure_url;
  }
}

const provider = process.env.STORAGE_PROVIDER || "local";
export const storageService: IStorageService =
  provider === "cloudinary" ? new CloudinaryStorageService() : new LocalStorageService();
