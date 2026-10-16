import { Request, Response } from "express";
import { getWeather } from "../services/weather.service";

export async function getTemperature(
  req: Request,
  res: Response
) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required."
      });
    }

    const weather = await getWeather(
      latitude,
      longitude
    );

    return res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to get weather data."
    });
  }
}