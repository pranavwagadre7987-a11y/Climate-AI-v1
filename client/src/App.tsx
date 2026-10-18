
import { useState } from "react";
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

const API_URL = "http://localhost:5000/api/prediction";

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
  confidence?: number;
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
      temp < -100 ||
      temp > 70 ||
      humid < 0 ||
      humid > 100 ||
      wind < 0 ||
      rain < 0 ||
      press <= 0
    ) {
      setPrediction(null);
      setError("Please enter valid values for all environmental fields.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

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
        confidence:
          typeof data.confidence === "number"
            ? data.confidence
            : undefined,
        message:
          typeof data.message === "string"
            ? data.message
            : undefined,
      });
    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the Climate AI server."
      );
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
        <h2>AI temperature prediction</h2>
        <p>
          Enter environmental measurements to request a
          prediction from your Climate AI backend.
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
              min="1"
              step="0.1"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={predict}
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict temperature"}
        </button>

        {error && (
          <div className="error" role="alert">
            <strong>Prediction error</strong>
            <p>{error}</p>
          </div>
        )}

        {prediction && (
          <div className="result" aria-live="polite">
            <span>Predicted temperature</span>
            <h2>
              {prediction.predictedTemperature.toFixed(1)}
              {prediction.unit}
            </h2>

            {prediction.confidence !== undefined && (
              <p>
                Server-reported confidence:{" "}
                {prediction.confidence}%
              </p>
            )}

            {prediction.message && (
              <small>{prediction.message}</small>
            )}

            <small>
              Result returned by the Climate AI prediction API.
            </small>
          </div>
        )}
      </section>

      <footer>
        Climate AI · Environmental awareness through data
      </footer>
    </main>
  );
}

export default App;
