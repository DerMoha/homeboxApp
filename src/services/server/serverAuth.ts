import axios from 'axios';
import {AxiosInstance} from 'axios';
import {ServerConfig} from '../../types';
import {HOMEBOX_ENDPOINTS} from './homeboxAdapter';

// Rate limiting: track failed attempts and backoff deadlines per server key
const failedAttempts = new Map<string, number>();
const backoffUntil = new Map<string, number>();

const serverKey = (config: ServerConfig): string =>
  config.id || `${config.host}:${config.username}`;

const backoffDelayMs = (attempts: number): number =>
  Math.pow(2, Math.min(attempts - 1, 6)) * 1000;

export const resetAuthenticationRateLimit = (): void => {
  failedAttempts.clear();
  backoffUntil.clear();
};

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

export const logoutServer = async (client: AxiosInstance): Promise<void> => {
  try {
    await client.post(HOMEBOX_ENDPOINTS.logout);
  } catch {
    // Best-effort logout — ignore errors so local state is always cleared
  }
};

export const authenticateServer = async (
  client: AxiosInstance,
  config: ServerConfig,
) => {
  const key = serverKey(config);
  const backoffTime = backoffUntil.get(key) ?? 0;
  if (Date.now() < backoffTime) {
    const waitSec = Math.ceil((backoffTime - Date.now()) / 1000);
    return {
      success: false as const,
      error: `Too many failed attempts. Please wait ${waitSec} second${
        waitSec !== 1 ? 's' : ''
      }.`,
    };
  }

  let loginResponse;
  try {
    loginResponse = await client.post(HOMEBOX_ENDPOINTS.login, {
      username: config.username,
      password: config.password,
      stayLoggedIn: false,
    });
  } catch (err) {
    const attempts = (failedAttempts.get(key) ?? 0) + 1;
    failedAttempts.set(key, attempts);
    backoffUntil.set(key, Date.now() + backoffDelayMs(attempts));
    throw err;
  }

  if (!loginResponse.data?.token) {
    const attempts = (failedAttempts.get(key) ?? 0) + 1;
    failedAttempts.set(key, attempts);
    backoffUntil.set(key, Date.now() + backoffDelayMs(attempts));
    return {
      success: false as const,
      error: 'Failed to get authentication token',
    };
  }

  failedAttempts.delete(key);
  backoffUntil.delete(key);

  return {
    success: true as const,
    token: sanitizeBearerToken(loginResponse.data.token),
    data: loginResponse.data,
  };
};

export const applyAuthorizationHeader = (
  client: AxiosInstance,
  token: string,
) => {
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
};
