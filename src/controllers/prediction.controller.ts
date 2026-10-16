import { Request, Response } from "express";
import { predictTemperature } from "../services/prediction.service";

export function predictTemperatureController(
  req: Request,
  res: Response
) {
  try {
    const {
      temperature,
      humidity,
      windSpeed,
      rainfall,
      pressure
    } = req.body;

    if (
      temperature === undefined ||
      humidity === undefined ||
      windSpeed === undefined ||
      rainfall === undefined ||
      pressure === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All environmental values are required."
      });
    }

    const result = predictTemperature({
      temperature: Number(temperature),
      humidity: Number(humidity),
      windSpeed: Number(windSpeed),
      rainfall: Number(rainfall),
      pressure: Number(pressure)
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Prediction failed."
    });
  }
}