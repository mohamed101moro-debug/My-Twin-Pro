import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { RelationshipDims } from '../store/useTwinStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let _token = '';
export function setToken(token: string) { _token = token; }
export function getToken() { return _token; }

API.interceptors.request.use(async (config) => {
  let token = _token;
  if (!token) {
    try {
      const stored = await SecureStore.getItemAsync('supabase.auth.token');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.access_token || parsed?.currentSession?.access_token || '';
      }
    } catch (e) {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', { status: error.response?.status, url: error.config?.url });
    return Promise.reject(error);
  }
);

export const askTwin = async (
  message: string,
  twinName: string,
  bond: number,
  dims: RelationshipDims,
  calm: boolean = false
) => {
  const { data } = await API.post('/api/chat', {
    message,
    twin_name: twinName,
    bond_level: bond,
    relationship_dims: {
      trust: dims.trust,
      affection: dims.affection,
      dependency: dims.dependency,
    },
  }, {
    headers: { 'X-Calm-Mode': String(calm) },
  });
  return {
    ...data,
    dims_update: {
      trust: data.relationship_dims?.trust ?? dims.trust,
      affection: data.relationship_dims?.affection ?? dims.affection,
      dependency: data.relationship_dims?.dependency ?? dims.dependency,
      empathy: dims.empathy,
      humor: dims.humor,
      support: dims.support,
    }
  };
};

export const startTrial = async (email: string, phone: string, deviceId: string) => {
  const { data } = await API.post('/api/trial/start', { email, phone, device_id: deviceId });
  return data;
};

export const transcribeAudio = async (): Promise<null> => null;

type MemoryPayload = {
  id?: string; user_id?: string; content: string;
  created_at?: string; importance_score?: number;
  memory_type?: string; emotion_tag?: string;
};

export const saveMemory = async (memory: MemoryPayload) => API.post('/api/memory/save', memory);
export default API;
