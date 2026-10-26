import { Request, Response } from "express";
import { processEnvironmentalData } from "../services/environmental.service";

function parseMeasurement(value: unknown): number | undefined {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getEnvironmentalData(
  req: Request,
  res: Response
) {
  try {
    const values = {
      temperature: parseMeasurement(req.query.temperature),
      humidity: parseMeasurement(req.query.humidity),
      windSpeed: parseMeasurement(req.query.windSpeed),
      rainfall: parseMeasurement(req.query.rainfall),
      pressure: parseMeasurement(req.query.pressure)
    };

    if (Object.values(values).some((value) => value === undefined)) {
      return res.status(400).json({
        success: false,
        message: "All environmental values are required."
      });
    }

    const normalized = values as {
      temperature: number;
      humidity: number;
      windSpeed: number;
      rainfall: number;
      pressure: number;
    };

    const result = processEnvironmentalData(normalized);

    return res.json({
      success: true,
      data: result
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Environmental data processing failed."
    });
  }
}