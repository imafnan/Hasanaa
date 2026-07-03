import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import bannersRouter from "./banners";
import categoriesRouter from "./categories";
import subcategoriesRouter from "./subcategories";
import productsRouter from "./products";
import ordersRouter from "./orders";
import promotionsRouter from "./promotions";
import uploadRouter from "./upload";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(bannersRouter);
router.use(categoriesRouter);
router.use(subcategoriesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(promotionsRouter);
router.use(uploadRouter);
router.use(settingsRouter);

export default router;
