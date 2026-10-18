# 🌿 Climate AI — AI-Based Temperature Prediction for Environmental Monitoring

Climate AI is an environmental monitoring web application developed as part of an Environmental Studies (EVS) project. It provides a dashboard for exploring environmental conditions and predicting temperature using a backend prediction service.

## 🎯 Project Objective

The objective of Climate AI is to demonstrate how artificial intelligence and software technology can support environmental awareness by analyzing environmental measurements and estimating temperature.

## ✨ Features

- 🌡️ Temperature monitoring dashboard
- 💧 Humidity and wind speed display
- 📈 Temperature trend visualization using charts
- 🤖 Temperature prediction using environmental inputs
- 🌧️ Environmental input fields for temperature, humidity, wind speed, rainfall, and atmospheric pressure
- ⚡ React frontend connected to a Node.js API
- 📱 Responsive user interface

## 🛠️ Technologies Used

**Frontend**
- React
- TypeScript
- Vite
- Recharts
- CSS

**Backend**
- Node.js
- Express.js
- TypeScript
- REST API

**Machine Learning**
- Python prediction script and model files (where configured)

## 📁 Project Structure

```text
Climate-AI/
├── client/             # React frontend
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       └── main.tsx
├── src/                # Node.js backend
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── types/
│   ├── utils/
│   ├── config/
│   ├── app.ts
│   └── server.ts
├── ml/                 # Python prediction resources
├── data/               # Environmental dataset
├── package.json
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- Git
- Visual Studio Code (recommended)

Python is needed only if you use the Python prediction component.

## 🚀 How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/pranavwagadre7987-a11y/Climate-AI-v1.git
cd Climate-AI-v1
```

### 2. Install backend dependencies

From the project root:

```bash
npm install
```

### 3. Start the backend

```bash
npm run dev
```

The backend is configured to run on port `5000`.

Test the API by opening:

```text
http://localhost:5000/
```

### 4. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal, usually `http://localhost:5173/`.

Keep both frontend and backend terminals running while testing the application.

## 🔌 Temperature Prediction API

**Endpoint:** `POST /api/prediction`

Example request body:

```json
{
  "temperature": 28,
  "humidity": 65,
  "windSpeed": 12,
  "rainfall": 0,
  "pressure": 1013
}
```

The API returns a success status and prediction data when the backend prediction service processes the request successfully.

## 🌍 Environmental Importance

Temperature prediction and environmental monitoring can help people understand weather patterns, changing environmental conditions, and the importance of climate awareness. This project demonstrates a software-based approach to environmental data analysis.

## ⚠️ Project Limitations

- Dashboard readings and chart data may be illustrative rather than live sensor readings.
- Prediction quality depends on the implemented prediction service and the data or model it uses.
- The application does not automatically collect live environmental data unless a suitable sensor or external data source is configured.
- The local development setup is not a public production deployment.

## 🔮 Future Improvements

- Integration with live weather APIs and environmental sensors
- Training and evaluation of a machine learning model using historical temperature data
- Location-based temperature predictions
- Historical environmental data storage and analysis
- Interactive charts and downloadable reports
- Deployment as a publicly accessible web application

## 👨‍🎓 Academic Project

**Project Title:** AI-Based Temperature Prediction for Environmental Monitoring  
**Project Name:** Climate AI  
**Project Type:** Environmental Studies (EVS) Project

Developed to explore the application of technology and AI in environmental monitoring and awareness.
