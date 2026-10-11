import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Terminals
export const getTerminals = async () => {
  const { data } = await api.get('/terminals');
  return data;
};

export const getTerminal = async (id: string) => {
  const { data } = await api.get(`/terminals/${id}`);
  return data;
};

export const createTerminal = async (name: string) => {
  const { data } = await api.post('/terminals', { name });
  return data;
};

export const deleteTerminal = async (id: string) => {
  await api.delete(`/terminals/${id}`);
};

export const executeCommand = async (id: string, command: string) => {
  const { data } = await api.post(`/terminals/${id}/execute`, { command });
  return data;
};

export const startTerminal = async (id: string) => {
  const { data } = await api.post(`/terminals/${id}/start`);
  return data;
};

export const stopTerminal = async (id: string) => {
  const { data } = await api.post(`/terminals/${id}/stop`);
  return data;
};

// Snapshots
export const getSnapshots = async () => {
  const { data } = await api.get('/snapshots');
  return data;
};

export const createSnapshot = async (name: string, terminalId: string) => {
  const { data } = await api.post('/snapshots', { name, terminalId });
  return data;
};

export const getSnapshot = async (id: string) => {
  const { data } = await api.get(`/snapshots/${id}`);
  return data;
};

export const restoreSnapshot = async (id: string) => {
  const { data } = await api.post(`/snapshots/${id}/restore`);
  return data;
};

export const deleteSnapshot = async (id: string) => {
  await api.delete(`/snapshots/${id}`);
};

// Users
export const getUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  name: string;
  roleId: string;
}) => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const deleteUser = async (id: string) => {
  await api.delete(`/users/${id}`);
};

// Roles
export const getRoles = async () => {
  const { data } = await api.get('/roles');
  return data;
};
