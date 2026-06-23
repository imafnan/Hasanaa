import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  GetDeliveryChargeResponse,
  UpdateDeliveryChargeBody,
  UpdateDeliveryChargeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /settings/delivery-charge
router.get("/settings/delivery-charge", async (req, res): Promise<void> => {
  try {
    let [setting] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "delivery_charge"));

    if (!setting) {
      // Default to 100 if not set in db
      [setting] = await db
        .insert(settingsTable)
        .values({
          key: "delivery_charge",
          value: "100",
        })
        .returning();
    }

    let [vatSetting] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, "vat"));

    if (!vatSetting) {
      // Default to 0 if not set in db
      [vatSetting] = await db
        .insert(settingsTable)
        .values({
          key: "vat",
          value: "0",
        })
        .returning();
    }

    const deliveryCharge = parseFloat(setting.value);
    const vat = parseFloat(vatSetting.value);
    res.json(GetDeliveryChargeResponse.parse({ deliveryCharge, vat }));
  } catch (err) {
    req.log.error(err, "Failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// POST /settings/delivery-charge
router.post("/settings/delivery-charge", async (req, res): Promise<void> => {
  const parsed = UpdateDeliveryChargeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { deliveryCharge, vat } = parsed.data;

  try {
    const [updatedCharge] = await db
      .insert(settingsTable)
      .values({
        key: "delivery_charge",
        value: String(deliveryCharge),
      })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value: String(deliveryCharge) },
      })
      .returning();

    const [updatedVat] = await db
      .insert(settingsTable)
      .values({
        key: "vat",
        value: String(vat),
      })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value: String(vat) },
      })
      .returning();

    res.json(
      UpdateDeliveryChargeResponse.parse({
        success: true,
        deliveryCharge: parseFloat(updatedCharge.value),
        vat: parseFloat(updatedVat.value),
      })
    );
  } catch (err) {
    req.log.error(err, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
