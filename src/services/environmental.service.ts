import { EnvironmentalData } from "../models/environmental.model";

export function processEnvironmentalData(
  data: EnvironmentalData
) {
  const status =
    data.temperature >= 35
      ? "High Temperature"
      : data.temperature >= 25
      ? "Moderate Temperature"
      : "Low Temperature";

  return {
    ...data,
    status,
    monitoredAt: new Date().toISOString()
  };
}