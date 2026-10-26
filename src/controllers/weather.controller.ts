import { Request, Response } from "express";

import { analyzeWeatherForecast, GroqAnalysisError } from "../services/groq.service";
import { getWeather, searchLocations } from "../services/weather.service";

function parseCoordinate(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export async function searchLocationsController(req: Request, res: Response) {
  try {
    const query = String(req.query.query ?? "").trim();
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "A location search query is required."
      });
    }

    const results = await searchLocations(query);

    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Location search failed:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to search for locations right now. Please try again."
    });
  }
}

export async function getForecastController(req: Request, res: Response) {
  try {
    const latitude = parseCoordinate(req.query.latitude);
    const longitude = parseCoordinate(req.query.longitude);

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required."
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude values are out of range."
      });
    }

    const data = await getWeather(latitude, longitude);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Weather forecast failed:", error);

    return res.status(502).json({
      success: false,
      message: "The weather service is currently unavailable. Please retry."
    });
  }
}

export async function generateWeatherInsightsController(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Provide a weather analysis payload as a JSON object."
      });
    }

    const location = typeof body.location === "object" && body.location !== null ? body.location : {};
    const current = typeof body.current === "object" && body.current !== null ? body.current : {};
    const daily = Array.isArray(body.daily) ? body.daily : [];

    if (!daily.length) {
      return res.status(400).json({
        success: false,
        message: "At least one forecast day is required for AI analysis."
      });
    }

    const result = await analyzeWeatherForecast({
      city: typeof location.city === "string" ? location.city : "Selected location",
      state: typeof location.state === "string" ? location.state : undefined,
      country: typeof location.country === "string" ? location.country : undefined,
      timezone: typeof location.timezone === "string" ? location.timezone : "auto",
      current: {
        temperature: typeof current.temperature === "number" ? current.temperature : null,
        apparentTemperature: typeof current.apparentTemperature === "number" ? current.apparentTemperature : null,
        humidity: typeof current.humidity === "number" ? current.humidity : null,
        precipitation: typeof current.precipitation === "number" ? current.precipitation : null,
        weatherCode: typeof current.weatherCode === "number" ? current.weatherCode : null,
        windSpeed: typeof current.windSpeed === "number" ? current.windSpeed : null,
        windDirection: typeof current.windDirection === "number" ? current.windDirection : null
      },
      daily: daily.slice(0, 7).map((item: any) => ({
        date: typeof item.date === "string" ? item.date : "",
        weatherCode: typeof item.weatherCode === "number" ? item.weatherCode : null,
        temperatureMax: typeof item.temperatureMax === "number" ? item.temperatureMax : null,
        temperatureMin: typeof item.temperatureMin === "number" ? item.temperatureMin : null,
        precipitationProbabilityMax: typeof item.precipitationProbabilityMax === "number" ? item.precipitationProbabilityMax : null,
        precipitationSum: typeof item.precipitationSum === "number" ? item.precipitationSum : null,
        windSpeedMax: typeof item.windSpeedMax === "number" ? item.windSpeedMax : null
      }))
    });

    return res.json({
      success: true,
      data: { insights: result }
    });
  } catch (error) {
    const errorMessage =
      error instanceof GroqAnalysisError
        ? error.kind === "missing_key"
          ? "AI insights are not configured. Add GROQ_API_KEY in the backend .env file."
          : error.kind === "rate_limited"
            ? "AI insights are rate-limited right now. Please retry shortly."
            : error.kind === "timeout"
              ? "AI insights timed out. Please retry."
              : "AI insights could not be generated from the forecast data."
        : "AI insights could not be generated from the forecast data.";

    return res.json({
      success: true,
      data: {
        insights: null,
        error: errorMessage
      }
    });
  }
}
