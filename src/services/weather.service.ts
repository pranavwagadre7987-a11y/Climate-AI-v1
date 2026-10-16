import axios from "axios";

export interface WeatherResult {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  rainfall: number;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult> {
  const response = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude,
        longitude,
        current:
          "temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,rain",
        timezone: "auto"
      }
    }
  );

  const current = response.data.current;

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    pressure: current.pressure_msl,
    rainfall: current.rain ?? 0,
    latitude,
    longitude,
    timezone: response.data.timezone
  };
}