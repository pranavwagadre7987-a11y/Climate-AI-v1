import { Request, Response } from "express";
import { processEnvironmentalData } from "../services/environmental.service";

export function getEnvironmentalData(
  req: Request,
  res: Response
) {
  try {
    const data = {
      temperature: Number(req.query.temperature),
      humidity: Number(req.query.humidity),
      windSpeed: Number(req.query.windSpeed),
      rainfall: Number(req.query.rainfall),
      pressure: Number(req.query.pressure)
    };

    const result = processEnvironmentalData(data);

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