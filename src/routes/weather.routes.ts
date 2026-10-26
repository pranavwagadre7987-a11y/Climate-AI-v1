import { Router } from "express";

import {
  generateWeatherInsightsController,
  getForecastController,
  searchLocationsController
} from "../controllers/weather.controller";

const router = Router();

router.get("/search", searchLocationsController);
router.get("/forecast", getForecastController);
router.post("/insights", generateWeatherInsightsController);

export default router;
