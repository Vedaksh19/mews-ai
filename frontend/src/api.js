import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const predictRisk = async (payload) => {
  const res = await api.post('/predict', payload);
  return res.data;
};

export const getStocks = async () => {
  const res = await api.get('/stocks');
  return res.data;
};

export const getStockTimeseries = async (stockId) => {
  const res = await api.get(`/stocks/${stockId}/timeseries`);
  return res.data;
};

export const getMetrics = async () => {
  const res = await api.get('/metrics');
  return res.data;
};

export const getEda = async () => {
  const res = await api.get('/eda');
  return res.data;
};

export const getFigureUrl = (name) => {
  return `/api/figures/${name}`;
};

export default api;
