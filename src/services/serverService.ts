import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ServerConfig {
  id: string;
  host: string;
  username: string;
  password: string;
  name?: string;
}

export interface ServerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  location?: {
    id: string;
    name: string;
  };
  labels?: Array<{
    id: string;
    name: string;
  }>;
  archived: boolean;
  assetId: string;
  createdAt: string;
  updatedAt: string;
  imageId?: string;
  insured: boolean;
  purchasePrice: number;
}

interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

class ServerService {
  private static instance: ServerService;
  private axiosInstance: AxiosInstance | null = null;
  private currentConfig: ServerConfig | null = null;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ServerService {
    if (!ServerService.instance) {
      ServerService.instance = new ServerService();
    }
    return ServerService.instance;
  }

  public async initialize(config: ServerConfig): Promise<ServerResponse> {
    try {
      this.currentConfig = config;
      const protocol = config.host.startsWith('http') ? '' : 'http://';
      this.axiosInstance = axios.create({
        baseURL: `${protocol}${config.host}`,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // First authenticate to get token
      const loginResponse = await this.axiosInstance.post('/api/v1/users/login', {
        username: config.username,
        password: config.password,
      });

      if (loginResponse.data && loginResponse.data.token) {
        this.token = loginResponse.data.token;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return {
          success: true,
          data: loginResponse.data,
        };
      } else {
        return {
          success: false,
          error: 'Failed to get authentication token',
        };
      }
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  public async testConnection(config: ServerConfig): Promise<ServerResponse> {
    try {
      const protocol = config.host.startsWith('http') ? '' : 'http://';
      const testInstance = axios.create({
        baseURL: `${protocol}${config.host}`,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Test authentication
      const loginResponse = await testInstance.post('/api/v1/users/login', {
        username: config.username,
        password: config.password,
      });

      if (loginResponse.data && loginResponse.data.token) {
        return {
          success: true,
          data: loginResponse.data,
        };
      } else {
        return {
          success: false,
          error: 'Failed to authenticate',
        };
      }
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  public async getServers(): Promise<ServerConfig[]> {
    try {
      const serversJson = await AsyncStorage.getItem('servers');
      return serversJson ? JSON.parse(serversJson) : [];
    } catch (error) {
      console.error('Error getting servers:', error);
      return [];
    }
  }

  public async saveServer(config: ServerConfig): Promise<boolean> {
    try {
      const servers = await this.getServers();
      const existingIndex = servers.findIndex(s => s.id === config.id);

      if (existingIndex >= 0) {
        servers[existingIndex] = config;
      } else {
        servers.push(config);
      }

      await AsyncStorage.setItem('servers', JSON.stringify(servers));
      return true;
    } catch (error) {
      console.error('Error saving server:', error);
      return false;
    }
  }

  public async deleteServer(serverId: string): Promise<boolean> {
    try {
      const servers = await this.getServers();
      const updatedServers = servers.filter(s => s.id !== serverId);
      await AsyncStorage.setItem('servers', JSON.stringify(updatedServers));
      return true;
    } catch (error) {
      console.error('Error deleting server:', error);
      return false;
    }
  }

  public getCurrentConfig(): ServerConfig | null {
    return this.currentConfig;
  }

  public getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  public async getInventory(): Promise<ServerResponse> {
    try {
      if (!this.axiosInstance || !this.token) {
        return {
          success: false,
          error: 'No active server connection or authentication token',
        };
      }

      const response = await this.axiosInstance.get('/api/v1/items');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): ServerResponse {
    if (error.response) {
      // Server responded with a status code outside 2xx
      const errorData = error.response.data as ErrorResponse;
      return {
        success: false,
        error: `Server error: ${error.response.status} - ${errorData.message || 'Unknown error'}`,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'No response from server. Please check your connection.',
      };
    } else {
      // Something happened in setting up the request
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}

export default ServerService; 