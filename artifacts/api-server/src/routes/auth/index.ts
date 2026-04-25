import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hasanaa2024";

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).admin = username;
  req.log.info({ username }, "Admin logged in");
  res.json({ success: true, admin: username });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  (req.session as any).admin = null;
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Error destroying session");
    }
  });
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const admin = (req.session as any).admin;
  res.json({ authenticated: !!admin, admin: admin || null });
});

export default router;
