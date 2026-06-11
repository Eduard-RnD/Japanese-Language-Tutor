import { Router, type IRouter } from "express";
import healthRouter from "./health";
import topicsRouter from "./topics";
import wordsRouter from "./words";
import practiceRouter from "./practice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(topicsRouter);
router.use(wordsRouter);
router.use(practiceRouter);

export default router;
