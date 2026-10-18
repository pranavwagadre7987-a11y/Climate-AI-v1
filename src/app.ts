
import express from "express";
import cors from "cors";

import predictionRoutes from "./routes/prediction.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Climate AI API is running!",
  });
});

// Temperature prediction API
app.use("/api/prediction", predictionRoutes);

export default app;
