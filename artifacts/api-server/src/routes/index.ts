import { Router, type IRouter } from "express";
import healthRouter from "./health";
import topicsRouter from "./topics";
import wordsRouter from "./words";
import practiceRouter from "./practice";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(topicsRouter);
router.use(wordsRouter);
router.use(practiceRouter);

export default router;
