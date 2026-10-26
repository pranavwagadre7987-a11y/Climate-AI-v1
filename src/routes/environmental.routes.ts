import { Router } from "express";
import { getEnvironmentalData } from "../controllers/environmental.controller";

const router = Router();

router.get("/", getEnvironmentalData);

export default router;
