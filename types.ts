
export interface WeightEntry {
  id: string;
  date: string; // ISO 8601 format
  weight: number;
}

export interface User {
  id: 'hussein' | 'rola';
  name:string;
  goalWeight: number;
  weightHistory: WeightEntry[];
}
