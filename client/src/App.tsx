
import { useState } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./App.css";

const API_URL = "/api/prediction";

const readings = [
  { time: "8 AM", temp: 24 },
  { time: "10 AM", temp: 27 },
  { time: "12 PM", temp: 31 },
  { time: "2 PM", temp: 30 },
  { time: "4 PM", temp: 28 },
  { time: "6 PM", temp: 26 },
];

type PredictionResult = {
  predictedTemperature: number;
  unit?: string;
  message?: string;
};

function App() {
  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("65");
  const [windSpeed, setWindSpeed] = useState("12");
  const [rainfall, setRainfall] = useState("0");
  const [pressure, setPressure] = useState("1013");

  const [prediction, setPrediction] =
    useState<PredictionResult | null>(null);
  const [submittedTemperature, setSubmittedTemperature] =
    useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(
        "Use temperature -90 to 60 °C, humidity 0 to 100%, wind 0 to 500 km/h, rainfall 0 to 1000 mm, and pressure 300 to 1200 hPa."
      );
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: temp,
          humidity: humid,
          windSpeed: wind,
          rainfall: rain,
          pressure: press,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "The prediction request failed."
        );
      }

      const data = result.data;
      const predictedValue = Number(data?.predictedTemperature);

      if (
        data?.predictedTemperature === undefined ||
        !Number.isFinite(predictedValue)
      ) {
        throw new Error(
          "The server response did not contain a valid predicted temperature."
        );
      }

      setPrediction({
        predictedTemperature: predictedValue,
        unit: data.unit || "°C",
        message:
          typeof data.message === "string"
            ? data.message
            : undefined,
      });
      setSubmittedTemperature(temp);
      setAiAnalysis(
        typeof result.aiAnalysis === "string" && result.aiAnalysis.trim()
          ? result.aiAnalysis
          : null
      );
      setAiError(
        typeof result.aiError === "string" && result.aiError.trim()
          ? result.aiError
          : result.aiAnalysis
            ? ""
            : "AI analysis was not included in the server response."
      );
    } catch (err) {
      console.error("Prediction error:", err);

      const message = err instanceof Error
        ? err.message
        : "Unable to connect to the Climate AI server.";
      setError(message);
      setPrediction(null);
      setSubmittedTemperature(null);
      setAiError("AI analysis could not be retrieved. Check the backend connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">🌿 Climate AI</div>
        <span>Environmental Monitoring</span>
      </header>

      <section className="intro">
        <p className="eyebrow">
          SMART ENVIRONMENTAL INTELLIGENCE
        </p>
        <h1>Understand your climate.</h1>
        <p>
          Monitor environmental conditions and explore
          temperature predictions.
        </p>
      </section>

      <section className="cards">
        <article className="card">
          <span>🌡️ Current temperature</span>
          <h2>28°C</h2>
          <small>Illustrative reading · Not live sensor data</small>
        </article>

        <article className="card">
          <span>💧 Humidity</span>
          <h2>65%</h2>
          <small>Illustrative reading</small>
        </article>

        <article className="card">
          <span>🌬️ Wind speed</span>
          <h2>12 km/h</h2>
          <small>Illustrative reading</small>
        </article>
      </section>

      <section className="panel">
        <h2>Temperature trends</h2>
        <p>
          Illustrative temperature readings throughout the day
        </p>

        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis unit="°C" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temp"
                name="Temperature"
                stroke="#168568"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel predictor">
        <h2>Environmental measurements</h2>
        <p>
          Enter measurements to calculate a formula-based estimate and request an AI interpretation. The estimate is not a weather forecast.
        </p>

        <div className="form-grid">
          <label>
            Current temperature (°C)
            <input
              type="number"
              value={temperature}
              onChange={(event) =>
                setTemperature(event.target.value)
              }
              min="-90"
              max="60"
              step="0.1"
            />
          </label>

          <label>
            Humidity (%)
            <input
              type="number"
              value={humidity}
              onChange={(event) =>
                setHumidity(event.target.value)
              }
              min="0"
              max="100"
              step="1"
            />
          </label>

          <label>
            Wind speed (km/h)
            <input
              type="number"
              value={windSpeed}
              onChange={(event) =>
                setWindSpeed(event.target.value)
              }
              min="0"
              max="500"
              step="0.1"
            />
          </label>

          <label>
            Rainfall (mm)
            <input
              type="number"
              value={rainfall}
              onChange={(event) =>
                setRainfall(event.target.value)
              }
              min="0"
              max="1000"
              step="0.1"
            />
          </label>

          <label>
            Atmospheric pressure (hPa)
            <input
              type="number"
              value={pressure}
              onChange={(event) =>
                setPressure(event.target.value)
              }
              min="300"
              max="1200"
              step="0.1"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={predict}
          disabled={loading}
        >
          {loading ? "Analyzing measurements..." : "Calculate estimate and analyze"}
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
              <div className="analysis-markdown">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            ) : aiError ? (
              <div className="ai-error" role="status">
                <p>{aiError}</p>
                <button
                  className="retry-button"
                  type="button"
                  onClick={predict}
                  disabled={loading}
                  aria-label="Retry AI analysis"
                >
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

      <footer>
        Climate AI · Environmental awareness through data
      </footer>
    </main>
  );
}

export default App;
