import { Router } from "express";
import {
  getTemperature
} from "../controllers/temperature.controller";

const router = Router();

router.get("/", getTemperature);

export default router;