import dotenv from "dotenv";
import path from "path";

// Load env variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "artifacts/api-server/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../artifacts/api-server/.env") });

import { db as pgDb } from "./index";
import * as pgSchema from "./schema";
import {
  connectDB,
  CategoryModel,
  SubcategoryModel,
  ProductModel,
  OrderModel,
  BannerModel,
  PromotionModel,
  SettingModel,
  CounterModel
} from "./mongodb";

async function runMigration() {
  console.log("Starting Postgres to MongoDB migration...");
  
  // 1. Connect MongoDB
  await connectDB();
  
  // 2. Migrate Categories
  console.log("Migrating Categories...");
  const pgCategories = await pgDb.select().from(pgSchema.categoriesTable);
  console.log(`Found ${pgCategories.length} categories in Postgres.`);
  await CategoryModel.deleteMany({});
  if (pgCategories.length > 0) {
    await CategoryModel.insertMany(pgCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      parentTag: c.parentTag,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    })));
    const maxId = Math.max(...pgCategories.map(c => c.id), 0);
    await CounterModel.findByIdAndUpdate("Category", { seq: maxId }, { upsert: true });
    console.log(`Categories migrated. Category counter set to ${maxId}.`);
  }

  // 3. Migrate Subcategories
  console.log("Migrating Subcategories...");
  const pgSubcategories = await pgDb.select().from(pgSchema.subcategoriesTable);
  console.log(`Found ${pgSubcategories.length} subcategories in Postgres.`);
  await SubcategoryModel.deleteMany({});
  if (pgSubcategories.length > 0) {
    await SubcategoryModel.insertMany(pgSubcategories.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      categoryId: s.categoryId,
      imageUrl: s.imageUrl,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    })));
    const maxId = Math.max(...pgSubcategories.map(s => s.id), 0);
    await CounterModel.findByIdAndUpdate("Subcategory", { seq: maxId }, { upsert: true });
    console.log(`Subcategories migrated. Subcategory counter set to ${maxId}.`);
  }

  // 4. Migrate Products
  console.log("Migrating Products...");
  const pgProducts = await pgDb.select().from(pgSchema.productsTable);
  console.log(`Found ${pgProducts.length} products in Postgres.`);
  await ProductModel.deleteMany({});
  if (pgProducts.length > 0) {
    await ProductModel.insertMany(pgProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(String(p.price)),
      originalPrice: p.originalPrice ? parseFloat(String(p.originalPrice)) : null,
      imageUrl: p.imageUrl,
      images: p.images ?? [],
      sizeChartUrl: p.sizeChartUrl,
      variantIds: p.variantIds ?? [],
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      inStock: p.inStock,
      isFeatured: p.isFeatured,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })));
    const maxId = Math.max(...pgProducts.map(p => p.id), 0);
    await CounterModel.findByIdAndUpdate("Product", { seq: maxId }, { upsert: true });
    console.log(`Products migrated. Product counter set to ${maxId}.`);
  }

  // 5. Migrate Orders
  console.log("Migrating Orders...");
  const pgOrders = await pgDb.select().from(pgSchema.ordersTable);
  console.log(`Found ${pgOrders.length} orders in Postgres.`);
  await OrderModel.deleteMany({});
  if (pgOrders.length > 0) {
    await OrderModel.insertMany(pgOrders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      customerCity: o.customerCity,
      customerEmail: o.customerEmail,
      customerArea: o.customerArea,
      deliveryCharge: parseFloat(String(o.deliveryCharge)),
      vat: parseFloat(String(o.vat)),
      notes: o.notes,
      status: o.status,
      totalAmount: parseFloat(String(o.totalAmount)),
      items: ((o.items as any[]) ?? []).map(item => ({
        productId: item.productId,
        productName: item.productName || "",
        price: parseFloat(String(item.price || "0")),
        quantity: item.quantity || 1,
        size: item.size || null,
        color: item.color || null,
        imageUrl: item.imageUrl || null
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    })));
    const maxId = Math.max(...pgOrders.map(o => o.id), 0);
    await CounterModel.findByIdAndUpdate("Order", { seq: maxId }, { upsert: true });
    console.log(`Orders migrated. Order counter set to ${maxId}.`);
  }

  // 6. Migrate Banners
  console.log("Migrating Banners...");
  const pgBanners = await pgDb.select().from(pgSchema.bannersTable);
  console.log(`Found ${pgBanners.length} banners in Postgres.`);
  await BannerModel.deleteMany({});
  if (pgBanners.length > 0) {
    await BannerModel.insertMany(pgBanners.map(b => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      categoryId: b.categoryId,
      subcategoryId: b.subcategoryId,
      position: b.position,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    })));
    const maxId = Math.max(...pgBanners.map(b => b.id), 0);
    await CounterModel.findByIdAndUpdate("Banner", { seq: maxId }, { upsert: true });
    console.log(`Banners migrated. Banner counter set to ${maxId}.`);
  }

  // 7. Migrate Promotions
  console.log("Migrating Promotions...");
  const pgPromotions = await pgDb.select().from(pgSchema.promotionsTable);
  console.log(`Found ${pgPromotions.length} promotions in Postgres.`);
  await PromotionModel.deleteMany({});
  if (pgPromotions.length > 0) {
    await PromotionModel.insertMany(pgPromotions.map(p => ({
      id: p.id,
      title: p.title,
      gridType: p.gridType,
      position: p.position,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      items: (p.items as any[]) ?? [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })));
    const maxId = Math.max(...pgPromotions.map(p => p.id), 0);
    await CounterModel.findByIdAndUpdate("Promotion", { seq: maxId }, { upsert: true });
    console.log(`Promotions migrated. Promotion counter set to ${maxId}.`);
  }

  // 8. Migrate Settings
  console.log("Migrating Settings...");
  const pgSettings = await pgDb.select().from(pgSchema.settingsTable);
  console.log(`Found ${pgSettings.length} settings in Postgres.`);
  await SettingModel.deleteMany({});
  if (pgSettings.length > 0) {
    await SettingModel.insertMany(pgSettings.map(s => ({
      key: s.key,
      value: s.value
    })));
    console.log(`Settings migrated.`);
  }

  console.log("All data successfully migrated to MongoDB!");
  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
