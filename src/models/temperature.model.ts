export interface TemperatureData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  pressure: number;
  location?: string;
  timestamp?: string;
}

export interface TemperaturePrediction {
  predictedTemperature: number;
  unit: string;
  confidence: number;
  message: string;
}