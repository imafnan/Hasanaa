import mongoose, { Schema } from "mongoose";
import path from "path";
import fs from "fs";

let mongoServer: any = null;

// Connection helper
export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return;

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log("No MONGODB_URI environment variable detected. Starting a persistent local in-process MongoDB instance...");
    const dbPath = path.resolve(import.meta.dirname, "../../mongodb-data");
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    try {
      // Dynamic import to avoid bundling and loading mongodb-memory-server in production
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: "wiredTiger",
          port: 27017,
        }
      });
      uri = mongoServer.getUri();
      console.log(`Local MongoDB started at: ${uri}`);
    } catch (err) {
      console.log("Failed to start local MongoMemoryServer (possibly already running). Trying to connect to localhost:27017 directly...");
      uri = "mongodb://localhost:27017/hasanaa";
    }
  }

  try {
    await mongoose.connect(uri!);
    console.log("Successfully connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
}

// Auto-increment sequence schema
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
export const CounterModel = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

export async function getNextSequenceValue(sequenceName: string): Promise<number> {
  const sequenceDocument = await CounterModel.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}

// 1. Banner Schema
const BannerSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: null },
  categoryId: { type: Number, default: null },
  subcategoryId: { type: Number, default: null },
  position: { type: String, default: "top" },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export const BannerModel = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);

// 2. Category Schema
const CategorySchema = new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  imageUrl: { type: String, default: null },
  parentTag: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema);

// 3. Subcategory Schema
const SubcategorySchema = new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  categoryId: { type: Number, required: true },
  imageUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export const SubcategoryModel = mongoose.models.Subcategory || mongoose.model("Subcategory", SubcategorySchema);

// 4. Product Schema
const ProductSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  imageUrl: { type: String, default: null },
  images: { type: [String], default: [] },
  sizeChartUrl: { type: String, default: null },
  variantIds: { type: [Number], default: [] },
  categoryId: { type: Number, default: null },
  subcategoryId: { type: Number, default: null },
  inStock: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] }
}, { timestamps: true });

export const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// 5. Order Schema
const OrderItemSchema = new Schema({
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, default: null },
  color: { type: String, default: null },
  imageUrl: { type: String, default: null }
}, { _id: false });

const OrderSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerCity: { type: String, default: null },
  customerEmail: { type: String, default: null },
  customerArea: { type: String, default: null },
  deliveryCharge: { type: Number, default: 0 },
  vat: { type: Number, default: 0 },
  notes: { type: String, default: null },
  status: { type: String, default: "pending" },
  totalAmount: { type: Number, required: true },
  items: { type: [OrderItemSchema], default: [] }
}, { timestamps: true });

export const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// 6. Promotion Schema
const PromotionItemSchema = new Schema({
  imageUrl: { type: String, required: true },
  label: { type: String, default: "" },
  categoryId: { type: Number, default: null },
  subcategoryId: { type: Number, default: null }
}, { _id: false });

const PromotionSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  gridType: { type: Number, default: 2 },
  position: { type: String, default: "top" },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  items: { type: [PromotionItemSchema], default: [] }
}, { timestamps: true });

export const PromotionModel = mongoose.models.Promotion || mongoose.model("Promotion", PromotionSchema);

// 7. Setting Schema
const SettingSchema = new Schema({
  key: { type: String, unique: true, required: true },
  value: { type: String, required: true }
});

export const SettingModel = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
