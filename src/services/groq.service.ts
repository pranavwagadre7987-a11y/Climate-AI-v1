
import "dotenv/config";
import Groq from "groq-sdk";
import { PredictionInput } from "../types/prediction.types";

export type GroqAnalysisErrorKind =
  | "missing_key"
  | "invalid_key"
  | "rate_limited"
  | "timeout"
  | "unavailable";

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
            "You are Climate AI, an environmental monitoring assistant for a college EVS project. Give a concise, student-friendly analysis with four headings: Measurement interpretation, Possible environmental implications, Suggested monitoring actions, and Limitations and uncertainty. Only interpret the supplied readings. Do not invent sensor readings, claim unverified weather events, provide numerical forecasts, or create confidence percentages. These measurements alone cannot establish a reliable future temperature forecast. Distinguish possible implications from verified observations."
        },
        {
          role: "user",
          content: `Analyze these environmental measurements:

Temperature: ${input.temperature} °C
Humidity: ${input.humidity}%
Wind speed: ${input.windSpeed} km/h
Rainfall: ${input.rainfall} mm
Atmospheric pressure: ${input.pressure} hPa

Keep the analysis grounded in these values. Do not present the configured numerical estimate as a verified weather forecast.`
        }
      ],
      max_completion_tokens: 400
    });

    analysis = completion.choices[0]?.message?.content;
  } catch (error) {
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

  return analysis;
}
