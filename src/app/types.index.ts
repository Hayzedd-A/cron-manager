export interface ServiceResponse {
  text: string;
  code: number;
}

export interface ServiceHistory {
  response: ServiceResponse;
  timestamp: string;
}

export interface Service {
  _id: string;
  name: string;
  url: string;
  query?: Record<string, any>;
  active: boolean;
  status: "up" | "down";
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  history: ServiceHistory[];
  lastPing: string;
  lastResponse: ServiceResponse;
}

export interface ServiceStats {
  total: number;
  up: number;
  down: number;
  paused: number;
  avgUptime: number;
}
