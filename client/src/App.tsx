
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

const earthViews = {
  satellite: {
    label: "Satellite imagery",
    provider: "Zoom Earth",
    description:
      "Explore satellite imagery, cloud formations, temperatures, wind, and forecast models.",
    url: "https://zoom.earth/maps/satellite/",
    icon: "🛰️",
  },
  radar: {
    label: "Rainfall radar",
    provider: "RainViewer",
    description:
      "Explore animated precipitation radar and satellite-based weather visualizations.",
    url: "https://www.rainviewer.com/map.html?loc=20,0,2&layer=radar",
    icon: "🌧️",
  },
} as const;

function App() {
  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("65");
  const [windSpeed, setWindSpeed] = useState("12");
  const [rainfall, setRainfall] = useState("0");
  const [pressure, setPressure] = useState("1013");
  const [earthView, setEarthView] =
    useState<keyof typeof earthViews>("satellite");

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
        <a className="brand" href="#overview">
          <span className="brand-mark" aria-hidden="true">◉</span>
          <span>CLIMATE<span className="brand-accent">AI</span></span>
        </a>
        <nav className="topbar-nav" aria-label="Main navigation">
          <a href="#earth-explorer">Live map</a>
          <a href="#analytics">Analytics</a>
          <a href="#prediction">AI prediction</a>
        </nav>
        <span className="system-status">
          <span className="status-dot" />
          ENVIRONMENTAL MONITORING
        </span>
      </header>

      <div id="overview">
        <section className="intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            PLANETARY INTELLIGENCE · 01
          </p>
          <h1>See the bigger<br /><span>climate picture.</span></h1>
          <p>
            Explore Earth in real time, track environmental patterns, and turn
            climate data into clearer decisions.
          </p>
        </section>

        <section className="panel earth-explorer" id="earth-explorer">
          <div className="earth-heading">
            <div>
              <p className="eyebrow">LIVE EARTH OBSERVATION</p>
              <h2>Explore the atmosphere</h2>
              <p>
                Satellite imagery, cloud formations, and precipitation patterns
                from across the globe.
              </p>
            </div>
            <span className="earth-globe" aria-hidden="true">
              ◉
            </span>
          </div>

          <div className="earth-map-toolbar">
            <div className="earth-tabs" aria-label="Earth Explorer maps">
              {(Object.keys(earthViews) as Array<keyof typeof earthViews>).map(
                (view) => (
                  <button
                    key={view}
                    id={`earth-tab-${view}`}
                    className={
                      earthView === view ? "earth-tab active" : "earth-tab"
                    }
                    type="button"
                    aria-pressed={earthView === view}
                    onClick={() => setEarthView(view)}
                  >
                    <span aria-hidden="true">{earthViews[view].icon}</span>
                    {earthViews[view].label}
                  </button>
                ),
              )}
            </div>
            <span className="map-live-indicator">
              <span className="status-dot" /> EXTERNAL LIVE MAP
            </span>
          </div>

          <div
            className="earth-map-panel"
            id="earth-map-panel"
            role="region"
            aria-label={`${earthViews[earthView].provider} map`}
          >
            <div className="earth-map-copy">
              <div>
                <span className="earth-provider">
                  {earthViews[earthView].icon} {earthViews[earthView].provider}
                </span>
                <p>{earthViews[earthView].description}</p>
              </div>
              <a
                className="earth-open-link"
                href={earthViews[earthView].url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open map <span aria-hidden="true">↗</span>
              </a>
            </div>
            <iframe
              key={earthView}
              className="earth-map-frame"
              src={earthViews[earthView].url}
              title={`${earthViews[earthView].provider} ${earthViews[earthView].label} map`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <p className="earth-map-note">
              Imagery and forecasts by {earthViews[earthView].provider}. If the
              map does not load here, open it directly using the map link.
            </p>
          </div>
        </section>
      </div>

      <section className="cards">
        <article className="card">
          <span className="card-label"><span className="metric-icon">◉</span> CURRENT TEMPERATURE</span>
          <h2>28°C</h2>
          <small>Illustrative reading · Not live sensor data</small>
        </article>

        <article className="card">
          <span className="card-label"><span className="metric-icon">◌</span> HUMIDITY</span>
          <h2>65%</h2>
          <small>Illustrative reading</small>
        </article>

        <article className="card">
          <span className="card-label"><span className="metric-icon">〰</span> WIND SPEED</span>
          <h2>12 km/h</h2>
          <small>Illustrative reading</small>
        </article>
      </section>

      <section className="panel analytics-panel" id="analytics">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLIMATE SIGNALS</p>
            <h2>Temperature trends</h2>
          </div>
          <span className="illustrative-tag">SAMPLE DATA</span>
        </div>
        <p>
          Illustrative temperature readings throughout the day
        </p>

        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readings}>
              <CartesianGrid stroke="#20364a" strokeDasharray="3 5" />
              <XAxis dataKey="time" stroke="#71869a" tick={{ fill: "#91a4b7", fontSize: 12 }} />
              <YAxis unit="°C" stroke="#71869a" tick={{ fill: "#91a4b7", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  color: "#e8f4ff",
                  background: "#0b1827",
                  border: "1px solid #29445c",
                  borderRadius: "10px",
                }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                name="Temperature"
                stroke="#30d6d0"
                strokeWidth={3}
                activeDot={{ r: 6, fill: "#30d6d0", stroke: "#0b1827", strokeWidth: 3 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel predictor" id="prediction">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PREDICTIVE MODELLING</p>
            <h2>AI temperature prediction</h2>
          </div>
          <span className="ai-mark">✳ AI</span>
        </div>
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
        <span>CLIMATE<span className="brand-accent">AI</span></span>
        <span>Environmental awareness through data</span>
      </footer>
    </main>
  );
}

export default App;
