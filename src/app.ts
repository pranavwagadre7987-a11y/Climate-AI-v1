
import express from "express";
import cors from "cors";

import environmentalRoutes from "./routes/environmental.routes";
import predictionRoutes from "./routes/prediction.routes";
import temperatureRoutes from "./routes/temperature.routes";
import weatherRoutes from "./routes/weather.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Climate AI API is running!"
  });
});

app.use("/api/temperature", temperatureRoutes);
app.use("/api/environmental", environmentalRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/weather", weatherRoutes);

app.use("/api", (_req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (res.headersSent) {
      return next(error);
    }

    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 600
        ? error.status
        : 500;

    console.error("Request failed:", error);

    return res.status(status).json({
      success: false,
      message:
        status === 400
          ? "Request body must contain valid JSON."
          : status === 413
            ? "Request body is too large."
            : "Internal server error."
    });
  }
);

export default app;
