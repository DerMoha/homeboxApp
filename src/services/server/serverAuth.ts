import axios from 'axios';
import {AxiosInstance} from 'axios';
import {ServerConfig} from '../../types';

export const createAxiosConfig = (baseURL: string) => ({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createAxiosClient = (baseURL: string): AxiosInstance =>
  axios.create(createAxiosConfig(baseURL));

export const sanitizeBearerToken = (token: string) =>
  token.startsWith('Bearer ') ? token.substring(7) : token;

export const authenticateServer = async (
  client: AxiosInstance,
  config: ServerConfig,
) => {
  const loginResponse = await client.post('/api/v1/users/login', {
    username: config.username,
    password: config.password,
  });

  if (!loginResponse.data?.token) {
    return {
      success: false as const,
      error: 'Failed to get authentication token',
    };
  }

  return {
    success: true as const,
    token: sanitizeBearerToken(loginResponse.data.token),
    data: loginResponse.data,
  };
};

export const testServerAuthentication = async (
  client: AxiosInstance,
  config: ServerConfig,
) => {
  const loginResponse = await client.post('/api/v1/users/login', {
    username: config.username,
    password: config.password,
  });

  if (!loginResponse.data?.token) {
    return {
      success: false as const,
      error: 'Failed to authenticate',
    };
  }

  return {
    success: true as const,
    data: loginResponse.data,
  };
};

export const applyAuthorizationHeader = (
  client: AxiosInstance,
  token: string,
) => {
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
};
