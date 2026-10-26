import axios from "axios";

export interface GeoLocationResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherResult {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCode: number | null;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DailyForecastSummary {
  date: string;
  dayLabel: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
}

export interface HourlyForecastPoint {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  windSpeed: number | null;
  windDirection: number | null;
}

export interface ForecastPayload {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherResult;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastSummary[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function searchLocations(query: string): Promise<GeoLocationResult[]> {
  const normalized = query.trim();
  if (!normalized || normalized.length < 2) {
    return [];
  }

  const response = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
    params: { name: normalized, count: 10, language: "en", format: "json" },
    timeout: 12_000
  });

  const results = Array.isArray(response.data?.results) ? response.data.results : [];

  return results
    .filter((item: any) => typeof item?.latitude === "number" && typeof item?.longitude === "number")
    .map((item: any) => ({
      id: Number(item.id ?? `${item.latitude}-${item.longitude}`),
      name: item.name ?? "Unknown location",
      country: item.country ?? undefined,
      admin1: item.admin1 ?? undefined,
      admin2: item.admin2 ?? undefined,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timezone: item.timezone ?? undefined
    }));
}

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<ForecastPayload> {
  const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude,
      longitude,
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      hourly:
        "temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
      forecast_days: 7,
      timezone: "auto"
    },
    timeout: 12_000
  });

  const rawCurrent = response.data?.current ?? {};
  const rawHourly = Array.isArray(response.data?.hourly?.time) ? response.data.hourly : { time: [], temperature_2m: [], precipitation: [], precipitation_probability: [], wind_speed_10m: [], wind_direction_10m: [] };
  const rawDaily = Array.isArray(response.data?.daily?.time) ? response.data.daily : { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_probability_max: [], precipitation_sum: [], wind_speed_10m_max: [] };

  const hourly = rawHourly.time.map((time: string, index: number) => ({
    time,
    temperature: toNumber(rawHourly.temperature_2m?.[index]),
    precipitation: toNumber(rawHourly.precipitation?.[index]),
    precipitationProbability: toNumber(rawHourly.precipitation_probability?.[index]),
    windSpeed: toNumber(rawHourly.wind_speed_10m?.[index]),
    windDirection: toNumber(rawHourly.wind_direction_10m?.[index])
  }));

  const daily = rawDaily.time.map((date: string, index: number) => ({
    date,
    dayLabel: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
    weatherCode: toNumber(rawDaily.weather_code?.[index]),
    temperatureMax: toNumber(rawDaily.temperature_2m_max?.[index]),
    temperatureMin: toNumber(rawDaily.temperature_2m_min?.[index]),
    precipitationProbabilityMax: toNumber(rawDaily.precipitation_probability_max?.[index]),
    precipitationSum: toNumber(rawDaily.precipitation_sum?.[index]),
    windSpeedMax: toNumber(rawDaily.wind_speed_10m_max?.[index])
  }));

  const current: WeatherResult = {
    temperature: toNumber(rawCurrent.temperature_2m),
    apparentTemperature: toNumber(rawCurrent.apparent_temperature),
    humidity: toNumber(rawCurrent.relative_humidity_2m),
    windSpeed: toNumber(rawCurrent.wind_speed_10m),
    windDirection: toNumber(rawCurrent.wind_direction_10m),
    precipitation: toNumber(rawCurrent.precipitation),
    precipitationProbability: toNumber(rawCurrent.precipitation_probability),
    weatherCode: toNumber(rawCurrent.weather_code),
    latitude,
    longitude,
    timezone: String(response.data?.timezone ?? "auto")
  };

  return {
    latitude,
    longitude,
    timezone: String(response.data?.timezone ?? "auto"),
    current,
    hourly,
    daily
  };
}

export const oldWeatherResult = getWeather;