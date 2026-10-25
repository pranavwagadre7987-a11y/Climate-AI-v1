export interface PredictionInput {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  pressure: number;
}

export interface PredictionResponse {
  predictedTemperature: number;
  unit: "°C";
  message: string;
}