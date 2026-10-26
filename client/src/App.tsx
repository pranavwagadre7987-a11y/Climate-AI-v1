
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RotateCw,
  Search,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const API_URL = "/api/prediction";
const POPULAR_CITIES = [
  { name: "Pune", state: "Maharashtra", country: "India", latitude: 18.5204, longitude: 73.8567 },
  { name: "Mumbai", state: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi", state: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Bengaluru", state: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Hyderabad", state: "Telangana", country: "India", latitude: 17.385, longitude: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", country: "India", latitude: 13.0827, longitude: 80.2707 },
  { name: "Kolkata", state: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { name: "Jaipur", state: "Rajasthan", country: "India", latitude: 26.9124, longitude: 75.7873 },
  { name: "Lucknow", state: "Uttar Pradesh", country: "India", latitude: 26.8467, longitude: 80.9462 },
  { name: "Ahmedabad", state: "Gujarat", country: "India", latitude: 23.0225, longitude: 72.5714 },
  { name: "Guwahati", state: "Assam", country: "India", latitude: 26.1445, longitude: 91.7362 },
] as const;

type PredictionResult = {
  predictedTemperature: number;
  unit?: string;
  message?: string;
};

type MetricKey = "temperature" | "precipitation" | "wind";

type DashboardLocation = {
  id: string | number;
  name: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type DailyForecastDay = {
  date: string;
  dayLabel: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
};

type HourlyForecastPoint = {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  windSpeed: number | null;
  windDirection: number | null;
};

type WeatherData = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    precipitation: number | null;
    precipitationProbability: number | null;
    weatherCode: number | null;
    windSpeed: number | null;
    windDirection: number | null;
  };
  daily: DailyForecastDay[];
  hourly: HourlyForecastPoint[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatTemperature(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(1)}°C`;
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)}${suffix}`;
}

function getWeatherLabel(code: number | null | undefined): string {
  switch (code) {
    case 0:
      return "Clear";
    case 1:
    case 2:
      return "Partly cloudy";
    case 3:
      return "Cloudy";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return "Rain";
    case 71:
    case 73:
    case 75:
    case 77:
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
    case 96:
    case 99:
      return "Thunderstorms";
    default:
      return "Weather update";
  }
}

function getWeatherIcon(code: number | null | undefined) {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3 || code === 45 || code === 48) return CloudFog;
  if (code === 61 || code === 63 || code === 65 || code === 80 || code === 81 || code === 82) return CloudRain;
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return CloudDrizzle;
  return Cloud;
}

function formatDateLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }
  return parsedDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHourLabel(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleTimeString("en-IN", {
    hour: "numeric",
  });
}

function getDirectionLabel(direction: number | null | undefined) {
  if (direction === null || direction === undefined || Number.isNaN(direction)) {
    return "—";
  }
  const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]; 
  const index = Math.round(((direction % 360) / 45)) % 8;
  return sectors[index];
}

async function readPredictionResponse(response: Response): Promise<Record<string, unknown>> {
  const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;

  if (!response.body) {
    throw new Error(`The server returned no response body (${status}). Check that the backend is running.`);
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    throw new Error(`Could not read the server response (${status}). Check the backend connection and retry.`);
  }

  if (!text.trim()) {
    throw new Error(`The server returned an empty response (${status}). Check that the backend is running and retry.`);
  }

  let result: unknown;
  try {
    result = JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const responseKind = /html/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(text) ? "an HTML error page" : "invalid JSON";
    throw new Error(`The server returned ${responseKind} (${status}). Check the backend connection and retry.`);
  }

  if (!isRecord(result)) {
    throw new Error(`The server returned an unexpected response format (${status}).`);
  }

  if (!response.ok || result.success !== true) {
    const message = typeof result.message === "string" && result.message.trim() ? result.message : "The prediction request failed.";
    throw new Error(`${message} (${status})`);
  }

  return result;
}

async function readJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;

  if (!response.body) {
    throw new Error(`The server returned no response body (${status}). Check the backend connection and retry.`);
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    throw new Error(`Could not read the server response (${status}). Check the backend connection and retry.`);
  }

  if (!text.trim()) {
    throw new Error(`The server returned an empty response (${status}). Check the backend connection and retry.`);
  }

  let result: unknown;
  try {
    result = JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const responseKind = /html/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(text) ? "an HTML error page" : "invalid JSON";
    throw new Error(`The server returned ${responseKind} (${status}). Check the backend connection and retry.`);
  }

  if (!isRecord(result)) {
    throw new Error(`The server returned an unexpected response format (${status}).`);
  }

  if (!response.ok || result.success !== true) {
    const message = typeof result.message === "string" && result.message.trim() ? result.message : "The request failed.";
    throw new Error(`${message} (${status})`);
  }

  return result;
}

function App() {
  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("65");
  const [windSpeed, setWindSpeed] = useState("12");
  const [rainfall, setRainfall] = useState("0");
  const [pressure, setPressure] = useState("1013");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [submittedTemperature, setSubmittedTemperature] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("Pune");
  const [locationSuggestions, setLocationSuggestions] = useState<DashboardLocation[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<DashboardLocation>({
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: "Asia/Kolkata",
  });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [chartMetric, setChartMetric] = useState<MetricKey>("temperature");
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiInsightsError, setAiInsightsError] = useState("");
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  async function loadWeather(location: DashboardLocation) {
    setWeatherLoading(true);
    setWeatherError("");
    setAiInsights(null);
    setAiInsightsError("");
    setAiInsightsLoading(true);

    try {
      const response = await fetch(`/api/weather/forecast?latitude=${location.latitude}&longitude=${location.longitude}`);
      const result = await readJsonResponse(response);
      const data = result.data;

      if (!isRecord(data)) {
        throw new Error("The weather service returned an unexpected payload.");
      }

      const normalizedWeather = {
        latitude: typeof data.latitude === "number" ? data.latitude : location.latitude,
        longitude: typeof data.longitude === "number" ? data.longitude : location.longitude,
        timezone: typeof data.timezone === "string" ? data.timezone : location.timezone || "Asia/Kolkata",
        current: {
          temperature: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).temperature === "number" ? Number((data.current as Record<string, unknown>).temperature) : null,
          apparentTemperature: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).apparentTemperature === "number" ? Number((data.current as Record<string, unknown>).apparentTemperature) : null,
          humidity: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).humidity === "number" ? Number((data.current as Record<string, unknown>).humidity) : null,
          precipitation: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).precipitation === "number" ? Number((data.current as Record<string, unknown>).precipitation) : null,
          precipitationProbability: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).precipitationProbability === "number" ? Number((data.current as Record<string, unknown>).precipitationProbability) : null,
          weatherCode: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).weatherCode === "number" ? Number((data.current as Record<string, unknown>).weatherCode) : null,
          windSpeed: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).windSpeed === "number" ? Number((data.current as Record<string, unknown>).windSpeed) : null,
          windDirection: typeof data.current === "object" && data.current !== null && typeof (data.current as Record<string, unknown>).windDirection === "number" ? Number((data.current as Record<string, unknown>).windDirection) : null,
        },
        daily: Array.isArray(data.daily) ? data.daily.map((day) => ({
          date: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).date === "string" ? String((day as Record<string, unknown>).date) : "",
          dayLabel: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).dayLabel === "string" ? String((day as Record<string, unknown>).dayLabel) : "",
          weatherCode: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).weatherCode === "number" ? Number((day as Record<string, unknown>).weatherCode) : null,
          temperatureMax: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).temperatureMax === "number" ? Number((day as Record<string, unknown>).temperatureMax) : null,
          temperatureMin: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).temperatureMin === "number" ? Number((day as Record<string, unknown>).temperatureMin) : null,
          precipitationProbabilityMax: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).precipitationProbabilityMax === "number" ? Number((day as Record<string, unknown>).precipitationProbabilityMax) : null,
          precipitationSum: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).precipitationSum === "number" ? Number((day as Record<string, unknown>).precipitationSum) : null,
          windSpeedMax: typeof day === "object" && day !== null && typeof (day as Record<string, unknown>).windSpeedMax === "number" ? Number((day as Record<string, unknown>).windSpeedMax) : null,
        })) : [],
        hourly: Array.isArray(data.hourly) ? data.hourly.map((hour) => ({
          time: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).time === "string" ? String((hour as Record<string, unknown>).time) : "",
          temperature: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).temperature === "number" ? Number((hour as Record<string, unknown>).temperature) : null,
          precipitation: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).precipitation === "number" ? Number((hour as Record<string, unknown>).precipitation) : null,
          precipitationProbability: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).precipitationProbability === "number" ? Number((hour as Record<string, unknown>).precipitationProbability) : null,
          windSpeed: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).windSpeed === "number" ? Number((hour as Record<string, unknown>).windSpeed) : null,
          windDirection: typeof hour === "object" && hour !== null && typeof (hour as Record<string, unknown>).windDirection === "number" ? Number((hour as Record<string, unknown>).windDirection) : null,
        })) : [],
      } as WeatherData;

      setWeatherData(normalizedWeather);
      setSelectedDayIndex(0);

      const aiResponse = await fetch("/api/weather/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: {
            city: location.name,
            state: location.state,
            country: location.country,
            timezone: normalizedWeather.timezone,
          },
          current: normalizedWeather.current,
          daily: normalizedWeather.daily,
        }),
      });

      const aiResult = await readJsonResponse(aiResponse);
      const aiData = isRecord(aiResult.data) ? aiResult.data : {};
      const parsedAi = typeof aiData.insights === "string" ? aiData.insights : null;
      const aiText = parsedAi && parsedAi.trim() ? parsedAi : null;
      const aiFailure = typeof aiData.error === "string" && aiData.error.trim() ? aiData.error : "";

      setAiInsights(aiText);
      setAiInsightsError(aiFailure);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The weather service could not load the forecast.";
      setWeatherError(message);
    } finally {
      setWeatherLoading(false);
      setAiInsightsLoading(false);
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLocationLoading(true);
        setLocationError("");
        const response = await fetch(`/api/weather/search?query=${encodeURIComponent(query)}`);
        const result = await readJsonResponse(response);
        const items = Array.isArray(result.data) ? result.data : [];
        const normalized = items.filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.name === "string" && typeof item.latitude === "number" && typeof item.longitude === "number");
        setLocationSuggestions(normalized.map((item) => ({
          id: typeof item.id === "string" || typeof item.id === "number" ? item.id : `${item.name}-${item.latitude}-${item.longitude}`,
          name: String(item.name),
          state: typeof item.state === "string" ? item.state : typeof item.admin1 === "string" ? item.admin1 : undefined,
          country: typeof item.country === "string" ? item.country : undefined,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          timezone: typeof item.timezone === "string" ? item.timezone : undefined,
        })));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Location search failed.";
        setLocationError(message);
      } finally {
        setLocationLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const defaultLocation = POPULAR_CITIES[0];
    void loadWeather({
      id: defaultLocation.name,
      name: defaultLocation.name,
      state: defaultLocation.state,
      country: defaultLocation.country,
      latitude: defaultLocation.latitude,
      longitude: defaultLocation.longitude,
      timezone: "Asia/Kolkata",
    });
    setSelectedLocation({
      id: defaultLocation.name,
      name: defaultLocation.name,
      state: defaultLocation.state,
      country: defaultLocation.country,
      latitude: defaultLocation.latitude,
      longitude: defaultLocation.longitude,
      timezone: "Asia/Kolkata",
    });
  }, []);

  async function predict() {
    const temp = Number(temperature);
    const humid = Number(humidity);
    const wind = Number(windSpeed);
    const rain = Number(rainfall);
    const press = Number(pressure);

    if (
      temperature.trim() === "" ||
      humidity.trim() === "" ||
      windSpeed.trim() === "" ||
      rainfall.trim() === "" ||
      pressure.trim() === "" ||
      !Number.isFinite(temp) ||
      !Number.isFinite(humid) ||
      !Number.isFinite(wind) ||
      !Number.isFinite(rain) ||
      !Number.isFinite(press) ||
      temp < -90 ||
      temp > 60 ||
      humid < 0 ||
      humid > 100 ||
      wind < 0 ||
      wind > 500 ||
      rain < 0 ||
      rain > 1000 ||
      press < 300 ||
      press > 1200
    ) {
      setPrediction(null);
      setSubmittedTemperature(null);
      setAiAnalysis(null);
      setAiError("");
      setError("Use temperature -90 to 60 °C, humidity 0 to 100%, wind 0 to 500 km/h, rainfall 0 to 1000 mm, and pressure 300 to 1200 hPa.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);
    setSubmittedTemperature(null);
    setAiAnalysis(null);
    setAiError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: temp,
          humidity: humid,
          windSpeed: wind,
          rainfall: rain,
          pressure: press,
        }),
      });

      const result = await readPredictionResponse(response);
      const data = result.data;

      if (!isRecord(data)) {
        throw new Error("The server response did not contain prediction data.");
      }

      const predictedValue = data.predictedTemperature;
      if (typeof predictedValue !== "number" || !Number.isFinite(predictedValue)) {
        throw new Error("The server response did not contain a valid predicted temperature.");
      }

      setPrediction({
        predictedTemperature: predictedValue,
        unit: typeof data.unit === "string" && data.unit ? data.unit : "°C",
        message: typeof data.message === "string" ? data.message : undefined,
      });
      setSubmittedTemperature(temp);
      setAiAnalysis(typeof result.aiAnalysis === "string" && result.aiAnalysis.trim() ? result.aiAnalysis : null);
      setAiError(
        typeof result.aiError === "string" && result.aiError.trim()
          ? result.aiError
          : result.aiAnalysis
            ? ""
            : "AI analysis was not included in the server response."
      );
    } catch (err) {
      const message = err instanceof TypeError ? "Could not connect to the Climate AI server. Check that the backend is running and retry." : err instanceof Error ? err.message : "An unexpected error interrupted the prediction request. Please retry.";
      setError(message);
      setPrediction(null);
      setSubmittedTemperature(null);
      setAiError("AI analysis could not be retrieved. Check the backend connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser. Use manual search instead.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const geoLocation = {
          id: "my-location",
          name: "My location",
          state: "Current position",
          country: "India",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: "auto",
        };

        setSelectedLocation(geoLocation);
        setQuery("My location");
        setLocationSuggestions([]);
        await loadWeather(geoLocation);
      },
      () => {
        setLocationError("Location access was denied. Manual search remains available.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const selectedDayWeather = weatherData?.daily[selectedDayIndex] ?? null;
  const hourlyChartData = useMemo(() => {
    if (!weatherData) {
      return [] as Array<{ time: string; value: number | null }>;
    }

    const dayKey = selectedDayWeather?.date;
    if (!dayKey) {
      return [] as Array<{ time: string; value: number | null }>;
    }

    return weatherData.hourly
      .filter((point) => point.time.startsWith(dayKey))
      .map((point) => ({
        time: formatHourLabel(point.time),
        value:
          chartMetric === "temperature"
            ? point.temperature
            : chartMetric === "precipitation"
              ? point.precipitationProbability ?? point.precipitation ?? null
              : point.windSpeed,
      }));
  }, [chartMetric, selectedDayWeather, weatherData]);

  const currentTemperature = weatherData?.current.temperature ?? null;
  const currentHumidity = weatherData?.current.humidity ?? null;
  const currentWind = weatherData?.current.windSpeed ?? null;
  const currentWeatherLabel = getWeatherLabel(weatherData?.current.weatherCode ?? null);
  const currentWeatherIcon = getWeatherIcon(weatherData?.current.weatherCode ?? null);
  const WeatherIcon = currentWeatherIcon;

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><CloudSun size={25} strokeWidth={1.8} /></span>
          <span className="brand-name">Climate AI</span>
        </div>
        <div className="topbar-meta">
          <span className="project-label">India weather dashboard</span>
          <span className="topbar-divider" aria-hidden="true" />
          <span className="monitoring-label"><Activity size={15} /> Real forecast data</span>
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">ATMOSPHERIC GLASS · LIVE FORECASTS</p>
        <h1>Weather for India, all in one view.</h1>
        <p>
          Search a city, district, or town across India and view live forecast conditions, hourly patterns, and AI interpretation based on the actual weather data returned by the API.
        </p>
      </section>

      <section className="panel search-panel">
        <div className="search-header">
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city, town, or district in India"
              aria-label="Search for a location"
            />
          </div>
          <button type="button" className="secondary-button" onClick={handleUseMyLocation}>
            <LocateFixed size={16} />
            Use my location
          </button>
        </div>

        {locationLoading && <p className="status-note">Searching locations…</p>}
        {locationError && <p className="error-text">{locationError}</p>}

        {locationSuggestions.length > 0 && (
          <div className="location-list" role="listbox" aria-label="Location suggestions">
            {locationSuggestions.map((location) => (
              <button
                key={location.id}
                type="button"
                className="location-option"
                onClick={() => {
                  setSelectedLocation(location);
                  setQuery(location.name);
                  setLocationSuggestions([]);
                  void loadWeather(location);
                }}
              >
                <MapPin size={15} />
                <span>
                  <strong>{location.name}</strong>
                  <small>{[location.state, location.country].filter(Boolean).join(", ")}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="popular-row" aria-label="Popular city shortcuts">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              className="popular-city"
              onClick={() => {
                const option = {
                  id: city.name,
                  name: city.name,
                  state: city.state,
                  country: city.country,
                  latitude: city.latitude,
                  longitude: city.longitude,
                  timezone: "Asia/Kolkata",
                };
                setSelectedLocation(option);
                setQuery(city.name);
                setLocationSuggestions([]);
                void loadWeather(option);
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
      </section>

      {weatherError && (
        <section className="panel alert-box" role="alert">
          <strong>Weather data unavailable</strong>
          <p>{weatherError}</p>
          <button type="button" className="retry-button" onClick={() => void loadWeather(selectedLocation)}>
            <RotateCw size={16} />
            Retry weather fetch
          </button>
        </section>
      )}

      <section className="weather-summary panel">
        <div className="weather-summary-header">
          <div className="location-block">
            <p className="eyebrow">CURRENT LOCATION</p>
            <h2>{selectedLocation.name}</h2>
            <p>{[selectedLocation.state, selectedLocation.country].filter(Boolean).join(", ")}</p>
          </div>
          <div className="weather-baseline">
            <span className="status-chip">{currentWeatherLabel}</span>
          </div>
        </div>

        {weatherLoading ? (
          <div className="loading-box">
            <LoaderCircle className="loading-spinner" size={20} />
            Loading forecast data…
          </div>
        ) : (
          <div className="summary-grid">
            <div className="primary-temp">
              <div className="weather-icon-wrap"><WeatherIcon size={52} /></div>
              <div>
                <div className="temperature-value-large">{formatTemperature(currentTemperature)}</div>
                <div className="summary-meta">Feels like {formatTemperature(weatherData?.current.apparentTemperature ?? null)}</div>
              </div>
            </div>

            <div className="stat-grid">
              <article className="stat-card">
                <span className="stat-label"><Thermometer size={15} /> High / low</span>
                <strong>{selectedDayWeather ? formatTemperature(selectedDayWeather.temperatureMax) : "—"}</strong>
                <small>{selectedDayWeather ? formatTemperature(selectedDayWeather.temperatureMin) : "—"}</small>
              </article>
              <article className="stat-card">
                <span className="stat-label"><Droplets size={15} /> Humidity</span>
                <strong>{formatNumber(currentHumidity, "%")}</strong>
                <small>Relative humidity</small>
              </article>
              <article className="stat-card">
                <span className="stat-label"><Wind size={15} /> Wind</span>
                <strong>{formatNumber(currentWind, " km/h")}</strong>
                <small>{getDirectionLabel(weatherData?.current.windDirection ?? null)}</small>
              </article>
              <article className="stat-card">
                <span className="stat-label"><Gauge size={15} /> Precipitation</span>
                <strong>{formatNumber(weatherData?.current.precipitation ?? null, " mm")}</strong>
                <small>{weatherData?.current.precipitationProbability !== null && weatherData?.current.precipitationProbability !== undefined ? `${weatherData.current.precipitationProbability.toFixed(0)}% chance` : "Chance unavailable"}</small>
              </article>
            </div>
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="chart-header">
          <div>
            <p className="eyebrow">HOURLY FORECAST</p>
            <h2>{selectedDayWeather ? formatDateLabel(selectedDayWeather.date) : "Selected day"}</h2>
          </div>

          <div className="metric-tabs" role="tablist" aria-label="Weather metric selection">
            <button type="button" className={chartMetric === "temperature" ? "active" : ""} onClick={() => setChartMetric("temperature")}>Temperature</button>
            <button type="button" className={chartMetric === "precipitation" ? "active" : ""} onClick={() => setChartMetric("precipitation")}>Precipitation</button>
            <button type="button" className={chartMetric === "wind" ? "active" : ""} onClick={() => setChartMetric("wind")}>Wind</button>
          </div>
        </div>

        {weatherData && weatherData.daily.length > 0 ? (
          <>
            <div className="mini-day-list">
              {weatherData.daily.map((day, index) => (
                <button
                  key={`${day.date}-${index}`}
                  type="button"
                  className={selectedDayIndex === index ? "mini-day active" : "mini-day"}
                  onClick={() => setSelectedDayIndex(index)}
                >
                  <span>{day.dayLabel.split(",")[0]}</span>
                  <strong>{day.temperatureMax !== null ? `${day.temperatureMax.toFixed(0)}°` : "—"}</strong>
                  <small>{day.temperatureMin !== null ? `${day.temperatureMin.toFixed(0)}°` : "—"}</small>
                </button>
              ))}
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourlyChartData}>
                  <CartesianGrid stroke="rgba(69, 91, 142, 0.12)" strokeDasharray="4 5" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit={chartMetric === "temperature" ? "°C" : chartMetric === "precipitation" ? "%" : " km/h"} />
                  <Tooltip formatter={(value) => {
                    const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
                    if (!Number.isFinite(numeric)) {
                      return "—";
                    }
                    return chartMetric === "temperature"
                      ? `${numeric.toFixed(1)}°C`
                      : chartMetric === "precipitation"
                        ? `${numeric.toFixed(0)}%`
                        : `${numeric.toFixed(0)} km/h`;
                  }} />
                  <Line type="monotone" dataKey="value" stroke="#4d7dff" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="empty-state">No hourly forecast data available for the selected day.</div>
        )}
      </section>

      <section className="panel forecast-panel">
        <div className="forecast-headline">
          <div>
            <p className="eyebrow">SEVEN-DAY FORECAST</p>
            <h2>Daily outlook</h2>
          </div>
          <span className="status-chip muted">Updated for {selectedLocation.name}</span>
        </div>

        <div className="forecast-row">
          {weatherData?.daily.map((day, index) => {
            const IconComponent = getWeatherIcon(day.weatherCode);
            return (
              <button
                key={`${day.date}-${index}`}
                type="button"
                className={selectedDayIndex === index ? "day-card active" : "day-card"}
                onClick={() => setSelectedDayIndex(index)}
              >
                <span className="day-name">{formatDateLabel(day.date).split(",")[0]}</span>
                <span className="day-date">{formatDateLabel(day.date).split(",").slice(1).join(",").trim()}</span>
                <span className="day-icon"><IconComponent size={26} /></span>
                <span className="day-weather">{getWeatherLabel(day.weatherCode)}</span>
                <span className="temperature-range"><strong>{day.temperatureMax !== null ? `${day.temperatureMax.toFixed(0)}°` : "—"}</strong> / {day.temperatureMin !== null ? `${day.temperatureMin.toFixed(0)}°` : "—"}</span>
                <span className="precip-probability">{day.precipitationProbabilityMax !== null ? `${day.precipitationProbabilityMax.toFixed(0)}% rain` : "Rain chance unavailable"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel insights-panel" aria-labelledby="weather-insights-title">
        <div className="insights-header">
          <div>
            <p className="eyebrow">AI WEATHER INSIGHTS</p>
            <h2 id="weather-insights-title">Forecast explanation</h2>
            <p>Groq interprets the actual forecast values for {selectedLocation.name} without replacing them.</p>
          </div>
          <span className="insights-label">Groq analysis</span>
        </div>

        {aiInsightsLoading ? (
          <p className="analysis-status"><LoaderCircle className="loading-spinner" size={18} /> Generating AI forecast summary…</p>
        ) : aiInsights ? (
          <div className="analysis-markdown"><ReactMarkdown>{aiInsights}</ReactMarkdown></div>
        ) : (
          <div className="ai-error">
            <p>{aiInsightsError || "AI insights are temporarily unavailable. The real weather forecast remains visible above."}</p>
          </div>
        )}
      </section>

      <section className="panel predictor">
        <h2>Formula-based estimate</h2>
        <p>
          Keep the existing educational estimate accessible as a separate formula-based calculation. It is not a validated weather forecast.
        </p>

        <div className="form-grid">
          <label>
            Current temperature (°C)
            <input type="number" value={temperature} onChange={(event) => setTemperature(event.target.value)} min="-90" max="60" step="0.1" />
          </label>
          <label>
            Humidity (%)
            <input type="number" value={humidity} onChange={(event) => setHumidity(event.target.value)} min="0" max="100" step="1" />
          </label>
          <label>
            Wind speed (km/h)
            <input type="number" value={windSpeed} onChange={(event) => setWindSpeed(event.target.value)} min="0" max="500" step="0.1" />
          </label>
          <label>
            Rainfall (mm)
            <input type="number" value={rainfall} onChange={(event) => setRainfall(event.target.value)} min="0" max="1000" step="0.1" />
          </label>
          <label>
            Atmospheric pressure (hPa)
            <input type="number" value={pressure} onChange={(event) => setPressure(event.target.value)} min="300" max="1200" step="0.1" />
          </label>
        </div>

        <button type="button" onClick={predict} disabled={loading}>
          {loading ? (
            <><LoaderCircle className="button-spinner" size={17} /> Analyzing measurements...</>
          ) : (
            <><Sparkles size={17} /> Generate environmental insights</>
          )}
        </button>

        {error && (
          <div className="error" role="alert">
            <strong>Prediction error</strong>
            <p>{error}</p>
          </div>
        )}
      </section>

      <section className="panel insights-panel" aria-labelledby="insights-title">
        <div className="insights-header">
          <div>
            <p className="eyebrow">MEASUREMENTS, EXPLAINED</p>
            <h2 id="insights-title">AI Environmental Insights</h2>
            <p>Numerical estimate and Groq-generated interpretation of your measurements.</p>
          </div>
          <span className="insights-label">Groq analysis</span>
        </div>

        <div className="insights-layout">
          <article className="insight-block temperature-block" aria-live="polite">
            <h3>Temperature results</h3>
            <div className="temperature-values">
              <section className="temperature-value">
                <h4>Measured Temperature</h4>
                {submittedTemperature !== null ? (
                  <p className="estimate-value">{submittedTemperature.toFixed(1)} °C</p>
                ) : (
                  <p className="insight-placeholder">Appears after a successful request.</p>
                )}
                <p className="insight-note">The temperature value supplied in the submitted measurements; not a live sensor reading.</p>
              </section>

              <section className="temperature-value estimate-value-block">
                <h4>Formula-Based Temperature Estimate</h4>
                {prediction ? (
                  <p className="estimate-value">{prediction.predictedTemperature.toFixed(1)} {prediction.unit}</p>
                ) : (
                  <p className="insight-placeholder">Appears after a successful request.</p>
                )}
                <p className="insight-note">
                  {prediction?.message || "Calculated using the project's configured formula and coefficients. It is not a trained, validated weather forecast."}
                </p>
              </section>
            </div>
          </article>

          <article className="insight-block analysis-block" aria-live="polite" aria-busy={loading}>
            <h3>AI Environmental Interpretation</h3>
            {loading ? (
              <p className="analysis-status" role="status">
                <LoaderCircle className="loading-spinner" size={18} aria-hidden="true" />
                Analyzing the submitted measurements...
              </p>
            ) : aiAnalysis ? (
              <div className="analysis-markdown"><ReactMarkdown>{aiAnalysis}</ReactMarkdown></div>
            ) : aiError ? (
              <div className="ai-error" role="status">
                <p>{aiError}</p>
                <button className="retry-button" type="button" onClick={predict} disabled={loading} aria-label="Retry AI analysis">
                  <RotateCw size={16} aria-hidden="true" />
                  Retry AI analysis
                </button>
              </div>
            ) : (
              <p className="insight-placeholder">Submit measurements to generate an interpretation, monitoring suggestions, and uncertainty notes.</p>
            )}
          </article>
        </div>
      </section>

      <footer>Climate AI · Environmental awareness through data</footer>
    </main>
  );
}

export default App;
