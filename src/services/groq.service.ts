
import "dotenv/config";
import Groq from "groq-sdk";
import { PredictionInput } from "../types/prediction.types";

export type GroqAnalysisErrorKind =
  | "missing_key"
  | "invalid_key"
  | "rate_limited"
  | "timeout"
  | "incomplete"
  | "unavailable";

const requiredSections = [
  "Measurement Interpretation",
  "Environmental Summary",
  "Potential Environmental Concerns",
  "Practical Recommendations",
  "Limitations"
];

function normalizeHeading(line: string): string {
  return line.trim()
    .replace(/^#+\s*/, "")
    .replace(/^(?:[A-E]|\d+)[.)]\s*/, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/^(?:[A-E]|\d+)[.)]\s*/, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}

function hasAllRequiredSections(analysis: string): boolean {
  const headings = analysis.split(/\r?\n/).map(normalizeHeading);

  return requiredSections.every((section) =>
    headings.includes(section.toLowerCase())
  );
}

export class GroqAnalysisError extends Error {
  constructor(readonly kind: GroqAnalysisErrorKind) {
    super("Groq environmental analysis failed.");
    this.name = "GroqAnalysisError";
  }
}

export async function analyzeEnvironment(
  input: PredictionInput
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new GroqAnalysisError("missing_key");
  }

  const groq = new Groq({
    apiKey,
    timeout: 15_000,
    maxRetries: 0
  });

  let analysis: string | null | undefined;
  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are Climate AI, an environmental monitoring assistant for a college Environmental Studies project. Return a concise report in Markdown with exactly these five headings: Measurement Interpretation, Environmental Summary, Potential Environmental Concerns, Practical Recommendations, and Limitations. In Measurement Interpretation, explain all five supplied values with their units. In Environmental Summary, distinguish the readings (observations) from interpretations. Mention concerns and recommendations only when reasonably supported by the readings; qualify uncertainty. Do not infer pollution, health risks, hazardous conditions, extreme weather, climate change, location, or causes without supporting data. Do not invent measurements, sensor readings, history, or future conditions. Never provide a numerical forecast, confidence percentage, or model accuracy. In Limitations, state that one set of measurements cannot establish a reliable weather forecast, long-term climate trend, air quality level, or cause of environmental changes, and clarify that the separate formula-based estimate is not a trained or validated forecast. Keep each section brief and educational."
        },
        {
          role: "user",
          content: `Analyze these environmental measurements:

Temperature: ${input.temperature} °C
Humidity: ${input.humidity}%
Wind speed: ${input.windSpeed} km/h
Rainfall: ${input.rainfall} mm
Atmospheric pressure: ${input.pressure} hPa

Keep the analysis grounded in these supplied values and units. Do not present the configured formula-based temperature estimate as an AI forecast or verified weather forecast.`
        }
      ],
      max_completion_tokens: 1200
    });

    const choice = completion.choices[0];
    if (!choice) {
      throw new GroqAnalysisError("unavailable");
    }
    if (choice.finish_reason === "length") {
      throw new GroqAnalysisError("incomplete");
    }
    if (choice.finish_reason !== "stop") {
      throw new GroqAnalysisError("unavailable");
    }

    analysis = choice.message?.content;
  } catch (error) {
    if (error instanceof GroqAnalysisError) {
      throw error;
    }

    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    const errorName =
      error instanceof Error ? error.name : "";
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (status === 429) {
      throw new GroqAnalysisError("rate_limited");
    }
    if (status === 401 || status === 403) {
      throw new GroqAnalysisError("invalid_key");
    }
    if (
      /timeout/i.test(errorName) ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      throw new GroqAnalysisError("timeout");
    }
    throw new GroqAnalysisError("unavailable");
  }

  if (!analysis || typeof analysis !== "string") {
    throw new GroqAnalysisError("unavailable");
  }
  if (!hasAllRequiredSections(analysis)) {
    throw new GroqAnalysisError("incomplete");
  }

  return analysis;
}

export interface WeatherForecastInsightInput {
  city: string;
  state?: string;
  country?: string;
  timezone: string;
  current: {
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    precipitation: number | null;
    weatherCode: number | null;
    windSpeed: number | null;
    windDirection: number | null;
  };
  daily: Array<{
    date: string;
    weatherCode: number | null;
    temperatureMax: number | null;
    temperatureMin: number | null;
    precipitationProbabilityMax: number | null;
    precipitationSum: number | null;
    windSpeedMax: number | null;
  }>;
}

export async function analyzeWeatherForecast(
  input: WeatherForecastInsightInput
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new GroqAnalysisError("missing_key");
  }

  const groq = new Groq({
    apiKey,
    timeout: 15_000,
    maxRetries: 0
  });

  const summaryText = JSON.stringify(
    {
      location: {
        city: input.city,
        state: input.state ?? null,
        country: input.country ?? null,
        timezone: input.timezone
      },
      current: input.current,
      daily: input.daily.slice(0, 7)
    },
    null,
    2
  );

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are Climate AI, a weather interpretation assistant. Use only the provided forecast values. Explain the actual weather conditions and the next seven days without inventing temperatures, hazards, alerts, or unsupported trends. Give a concise markdown report with sections: Weather Summary, Seven-Day Outlook, Rainfall and Humidity, Wind and Comfort, Recommendations, and Uncertainty and Limitations. Mention that the values come from a forecast API, not live sensor observations, when appropriate. Never invent severe-weather alerts, hazards, or exact future conditions. Do not claim to know the past or climate trend. If a metric is missing, say it was unavailable rather than substituting a value."
        },
        {
          role: "user",
          content: `Analyze this forecast data for ${input.city}.

${summaryText}

Only use these values. Keep the answer concise, practical, and grounded in the data. Do not replace the forecast with invented numbers or pretend live observations when the API is providing forecast data.`
        }
      ],
      max_completion_tokens: 1200
    });

    const choice = completion.choices[0];
    if (!choice) {
      throw new GroqAnalysisError("unavailable");
    }

    if (choice.finish_reason === "length") {
      throw new GroqAnalysisError("incomplete");
    }

    if (choice.finish_reason !== "stop") {
      throw new GroqAnalysisError("unavailable");
    }

    const analysis = choice.message?.content;
    if (!analysis || typeof analysis !== "string") {
      throw new GroqAnalysisError("unavailable");
    }

    return analysis;
  } catch (error) {
    if (error instanceof GroqAnalysisError) {
      throw error;
    }

    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    const errorName =
      error instanceof Error ? error.name : "";
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (status === 429) {
      throw new GroqAnalysisError("rate_limited");
    }
    if (status === 401 || status === 403) {
      throw new GroqAnalysisError("invalid_key");
    }
    if (
      /timeout/i.test(errorName) ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      throw new GroqAnalysisError("timeout");
    }

    throw new GroqAnalysisError("unavailable");
  }
}
