import { Request, Response } from "express";
import { predictTemperature } from "../services/prediction.service";
import {
  analyzeEnvironment,
  GroqAnalysisError
} from "../services/groq.service";
import { PredictionInput } from "../types/prediction.types";

function parseMeasurement(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getAiErrorMessage(error: unknown): string {
  if (!(error instanceof GroqAnalysisError)) {
    return "AI analysis is temporarily unavailable. Please retry.";
  }

  switch (error.kind) {
    case "missing_key":
      return "AI analysis is not configured. Add GROQ_API_KEY to the backend .env file.";
    case "invalid_key":
      return "AI analysis could not authenticate. Check the backend GROQ_API_KEY configuration.";
    case "rate_limited":
      return "AI analysis is rate-limited right now. Please retry shortly.";
    case "timeout":
      return "AI analysis took too long to respond. Please retry.";
    default:
      return "AI analysis is temporarily unavailable. Please retry.";
  }
}

export async function predictTemperatureController(
  req: Request,
  res: Response
) {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Provide environmental measurements as a JSON object."
      });
    }

    const values = {
      temperature: parseMeasurement(body.temperature),
      humidity: parseMeasurement(body.humidity),
      windSpeed: parseMeasurement(body.windSpeed),
      rainfall: parseMeasurement(body.rainfall),
      pressure: parseMeasurement(body.pressure)
    };

    if (Object.values(values).some((value) => value === undefined)) {
      return res.status(400).json({
        success: false,
        message: "All environmental values are required."
      });
    }

    const input = values as PredictionInput;

    if (
      input.temperature < -90 ||
      input.temperature > 60 ||
      input.humidity < 0 ||
      input.humidity > 100 ||
      input.rainfall < 0 ||
      input.rainfall > 1000 ||
      input.windSpeed < 0 ||
      input.windSpeed > 500 ||
      input.pressure < 300 ||
      input.pressure > 1200
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Measurements are outside valid ranges: temperature -90 to 60 °C, humidity 0 to 100%, wind 0 to 500 km/h, rainfall 0 to 1000 mm, and pressure 300 to 1200 hPa."
      });
    }

    const result = predictTemperature(input);

    let aiAnalysis: string | null = null;
    let aiError: string | null = null;

    try {
      aiAnalysis = await analyzeEnvironment(input);
    } catch (error) {
      console.error(
        "Groq analysis failed:",
        error instanceof GroqAnalysisError ? error.kind : "unexpected error"
      );
      aiError = getAiErrorMessage(error);
    }

    return res.json({
      success: true,
      data: result,
      aiAnalysis,
      aiError
    });
  } catch (error) {
    console.error("Prediction failed:", error);

    return res.status(500).json({
      success: false,
      message: "Prediction failed."
    });
  }
}
