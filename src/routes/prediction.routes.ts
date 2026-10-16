import { Router } from "express";
import {
  predictTemperatureController
} from "../controllers/prediction.controller";

const router = Router();

router.post(
  "/",
  predictTemperatureController
);

export default router;