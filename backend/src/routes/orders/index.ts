import { Router, type IRouter } from "express";
import { OrderModel, ProductModel, SettingModel, getNextSequenceValue } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  ListOrdersResponse,
  GetOrderResponse,
  GetOrderStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(o: any) {
  return {
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    customerCity: o.customerCity ?? null,
    customerEmail: o.customerEmail ?? null,
    customerArea: o.customerArea ?? null,
    deliveryCharge: String(o.deliveryCharge),
    vat: String(o.vat),
    notes: o.notes ?? null,
    status: o.status,
    totalAmount: String(o.totalAmount),
    items: ((o.items as any[]) ?? []).map(item => ({
      productId: item.productId,
      productName: item.productName || "",
      price: String(item.price || "0"),
      quantity: item.quantity || 1,
      size: item.size ?? null,
      color: item.color ?? null,
      imageUrl: item.imageUrl ?? null,
    })),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

router.get("/orders/stats", async (_req, res): Promise<void> => {
  const orders = await OrderModel.find({}).sort({ createdAt: 1 });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);

  const recentOrders = orders.slice(-10).reverse();

  res.json(GetOrderStatsResponse.parse({
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: totalRevenue.toFixed(2),
    recentOrders: recentOrders.map(formatOrder),
  }));
});

router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await OrderModel.find({}).sort({ createdAt: 1 });
  res.json(ListOrdersResponse.parse(orders.map(formatOrder).reverse()));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, customerPhone, customerAddress, customerCity, notes, items } = parsed.data;

  // Fetch current delivery charge setting
  const shippingSetting = await SettingModel.findOne({ key: "delivery_charge" });
  const deliveryCharge = shippingSetting ? parseFloat(shippingSetting.value) : 100;

  // Fetch current VAT setting
  const vatSetting = await SettingModel.findOne({ key: "vat" });
  const vatPercentage = vatSetting ? parseFloat(vatSetting.value) : 0;

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await ProductModel.findOne({ id: item.productId });
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = parseFloat(String(product.price));
    totalAmount += price * item.quantity;
    orderItems.push({
      productId: item.productId,
      productName: product.name,
      price: price,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
      imageUrl: product.imageUrl ?? null,
    });
  }

  const vatAmount = totalAmount * (vatPercentage / 100);
  const nextId = await getNextSequenceValue("Order");

  const order = await OrderModel.create({
    id: nextId,
    customerName,
    customerPhone,
    customerAddress,
    customerCity: customerCity ?? null,
    customerEmail: (parsed.data as any).customerEmail ?? null,
    customerArea: (parsed.data as any).customerArea ?? null,
    deliveryCharge,
    vat: vatAmount,
    notes: notes ?? null,
    status: "pending",
    totalAmount: totalAmount + deliveryCharge + vatAmount,
    items: orderItems,
  });

  res.status(201).json(GetOrderResponse.parse(formatOrder(order)));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await OrderModel.findOne({ id: params.data.id });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(formatOrder(order)));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const order = await OrderModel.findOneAndUpdate(
    { id: params.data.id },
    { status: parsed.data.status },
    { new: true }
  );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

export default router;
