import { Router } from "express";

import { getClosingFees } from "../controllers/closingRange.controller.js";

const router = Router();

router.get("/", getClosingFees);

export default router;
