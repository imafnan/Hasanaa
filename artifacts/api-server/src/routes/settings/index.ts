import { Router, type IRouter } from "express";
import { SettingModel } from "@workspace/db";
import {
  GetDeliveryChargeResponse,
  UpdateDeliveryChargeBody,
  UpdateDeliveryChargeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /settings/delivery-charge
router.get("/settings/delivery-charge", async (req, res): Promise<void> => {
  try {
    let setting = await SettingModel.findOne({ key: "delivery_charge" });
    if (!setting) {
      // Default to 100 if not set in db
      setting = await SettingModel.create({
        key: "delivery_charge",
        value: "100",
      });
    }

    let vatSetting = await SettingModel.findOne({ key: "vat" });
    if (!vatSetting) {
      // Default to 0 if not set in db
      vatSetting = await SettingModel.create({
        key: "vat",
        value: "0",
      });
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
    const updatedCharge = await SettingModel.findOneAndUpdate(
      { key: "delivery_charge" },
      { value: String(deliveryCharge) },
      { upsert: true, new: true }
    );

    const updatedVat = await SettingModel.findOneAndUpdate(
      { key: "vat" },
      { value: String(vat) },
      { upsert: true, new: true }
    );

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
