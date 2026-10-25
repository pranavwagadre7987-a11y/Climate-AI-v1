# Climate AI

Climate AI is a college EVS environmental-monitoring project. Its backend accepts temperature, humidity, wind speed, rainfall, and atmospheric pressure measurements. It returns the existing coefficient-based temperature estimate alongside an optional Groq-generated explanation.

## Configuration

Use Node.js and npm. Install the backend and frontend dependencies:

```sh
npm install
npm --prefix client install
```

Copy `.env.example` to `.env` in the repository root, then set `GROQ_API_KEY` to a key from Groq. `GROQ_MODEL` is optional and defaults to `openai/gpt-oss-20b`. The key is read only by the backend and must not be added to frontend environment variables.

## Run

Start the backend from the repository root:

```sh
npm run dev
```

In a second terminal, start the Vite frontend:

```sh
npm --prefix client run dev
```

The backend listens on `http://localhost:5000`; Vite prints the frontend URL. Production builds are available with `npm run build` and `npm --prefix client run build`.

## Prediction API

Send all five measurements to `POST /api/prediction`:

```sh
curl -X POST http://localhost:5000/api/prediction \
	-H 'Content-Type: application/json' \
	-d '{"temperature":28,"humidity":65,"windSpeed":12,"rainfall":0,"pressure":1013}'
```

The response contains `data` for the numerical estimate, `aiAnalysis` for the environmental interpretation, and `aiError` when the AI service is unavailable. Input units are °C, %, km/h, mm, and hPa. The endpoint validates values before running either service. A missing or failed Groq configuration does not prevent the numerical estimate from being returned.

## Model limitations

The current numerical estimate is calculated from fixed coefficients in `ml/model/temperature-model.json`. The repository contains no training pipeline or evaluation data proving those coefficients were learned from a dataset, so this is not a genuinely trained or validated ML model and its estimate is not a reliable weather forecast. A genuine ML implementation would require representative labeled observations, a documented training and validation process, evaluation against held-out data and a baseline, and a versioned model artifact with measured metrics. Groq provides explanations only; it does not produce the numerical estimate.
