import fs from "fs";
import path from "path";

import { PredictionInput } from "../types/prediction.types";
import { clamp, round } from "../utils/calculations";

interface Model {
  coefficients: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    pressure: number;
  };
  intercept: number;
  confidence: number;
}

export function predictTemperature(input: PredictionInput) {
  const modelPath = path.join(
    process.cwd(),
    "ml",
    "model",
    "temperature-model.json"
  );

  const model: Model = JSON.parse(
    fs.readFileSync(modelPath, "utf-8")
  );

  const predicted =
    model.intercept +
    model.coefficients.temperature * input.temperature +
    model.coefficients.humidity * input.humidity +
    model.coefficients.windSpeed * input.windSpeed +
    model.coefficients.rainfall * input.rainfall +
    model.coefficients.pressure * input.pressure;

  const temperature = clamp(
    round(predicted, 1),
    -20,
    60
  );

  return {
    predictedTemperature: temperature,
    unit: "°C",
    confidence: model.confidence,
    message:
      "Temperature prediction generated using the Climate AI regression model."
  };
}