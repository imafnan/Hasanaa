import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import bannersRouter from "./banners";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import ordersRouter from "./orders";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(bannersRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(uploadRouter);

export default router;
