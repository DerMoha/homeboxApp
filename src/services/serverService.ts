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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Location {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LocationResponse {
  locations: Location[];
  page: number;
  pageSize: number;
  total: number;
}

interface InventoryResponse {
  items: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    imageId: string | null;
    insured: boolean;
    purchasePrice: number;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
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
        // Ensure we don't have duplicate 'Bearer' in the token
        const cleanToken = this.token && this.token.startsWith('Bearer ') ? this.token.substring(7) : this.token;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
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

  public getBaseUrl(): string {
    if (!this.currentConfig) {
      throw new Error('No active server configuration');
    }
    const protocol = this.currentConfig.host.startsWith('http') ? '' : 'http://';
    return `${protocol}${this.currentConfig.host}`;
  }

  public getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  public async getInventory(page: number = 1, pageSize: number = 50): Promise<ServerResponse> {
    try {
      if (!this.axiosInstance || !this.token) {
        return {
          success: false,
          error: 'No active server connection or authentication token',
        };
      }

      const response = await this.axiosInstance.get('/api/v1/items', {
        params: {
          page,
          pageSize
        }
      });

      if (!response.data || !Array.isArray(response.data.items)) {
        return {
          success: false,
          error: 'Invalid response format from server',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Authentication required' };
        }
        if (error.response?.status === 403) {
          return { success: false, error: 'Access denied' };
        }
        return { 
          success: false, 
          error: error.response?.data?.message || 'Failed to get inventory' 
        };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async getLastUsedServer(): Promise<ServerConfig | null> {
    try {
      const lastUsedId = await AsyncStorage.getItem('lastUsedServerId');
      if (!lastUsedId) return null;

      const servers = await this.getServers();
      return servers.find(server => server.id === lastUsedId) || null;
    } catch (error) {
      console.error('Error getting last used server:', error);
      return null;
    }
  }

  public async setLastUsedServer(serverId: string): Promise<void> {
    try {
      await AsyncStorage.setItem('lastUsedServerId', serverId);
    } catch (error) {
      console.error('Error setting last used server:', error);
    }
  }

  public async autoConnect(): Promise<ServerResponse> {
    try {
      const lastUsedServer = await this.getLastUsedServer();
      if (!lastUsedServer) {
        return {
          success: false,
          error: 'No last used server found',
        };
      }

      return await this.initialize(lastUsedServer);
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

  /**
   * Transforms a raw array of locations into the expected response format
   * @param locations Array of location objects
   * @returns Formatted location response
   */
  private transformLocationsResponse(locations: Location[]): LocationResponse {
    return {
      locations,
      page: 1,
      pageSize: locations.length,
      total: locations.length
    };
  }

  /**
   * Fetches locations from the server
   * @returns Promise containing the locations data or an error
   */
  async getLocations(): Promise<ApiResponse<LocationResponse>> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance || !this.token) {
        console.error('No active server connection or authentication token in getLocations');
        return { success: false, error: 'No active server connection or authentication token' };
      }

      const response = await axiosInstance.get<Location[]>('/api/v1/locations', {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        return { success: false, error: 'Invalid response format from server' };
      }

      return { 
        success: true, 
        data: this.transformLocationsResponse(response.data)
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Locations API Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data
        });

        if (error.response?.status === 401) {
          return { success: false, error: 'Authentication required' };
        }
        if (error.response?.status === 403) {
          return { success: false, error: 'Access denied' };
        }
        if (error.response?.status === 500) {
          return { 
            success: false, 
            error: 'Server error occurred. Please try again later.' 
          };
        }
        return { 
          success: false, 
          error: error.response?.data?.message || 'Failed to get locations' 
        };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getLocationItems(locationId: string): Promise<ApiResponse<InventoryResponse>> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        return { success: false, error: 'No active server connection' };
      }
      // Fetch the full location tree
      const response = await axiosInstance.get('/api/v1/locations/tree');
      const tree = response.data;
      console.log('[getLocationItems] /api/v1/locations/tree response:', JSON.stringify(tree, null, 2));
      // Helper to recursively search for the location
      function findLocation(node: any, id: string): any | null {
        if (node.id === id) return node;
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findLocation(child, id);
            if (found) return found;
          }
        }
        return null;
      }
      let locationNode = null;
      if (Array.isArray(tree)) {
        // If root is array, search each root node
        for (const node of tree) {
          locationNode = findLocation(node, locationId);
          if (locationNode) break;
        }
      } else {
        // If root is object, search from root
        locationNode = findLocation(tree, locationId);
      }
      console.log('[getLocationItems] Found location node:', JSON.stringify(locationNode, null, 2));
      // Try to get items from the node
      let items = locationNode && locationNode.items ? locationNode.items : [];
      if (!items.length) {
        // Workaround: fetch all items and filter by locationId
        console.log('[getLocationItems] No items in tree node, fetching all items and filtering by location');
        const itemsResponse = await axiosInstance.get('/api/v1/items', { params: { page: 1, pageSize: 1000 } });
        const allItems = itemsResponse.data.items || [];
        items = allItems.filter((item: any) => item.location && item.location.id === locationId);
      }
      console.log('[getLocationItems] Items for location:', items);
      // Format as InventoryResponse for compatibility
      const inventoryResponse: InventoryResponse = {
        items: items,
        page: 1,
        pageSize: items.length,
        total: items.length
      };
      return { success: true, data: inventoryResponse };
    } catch (error) {
      console.error('Error getting location items:', error);
      return { success: false, error: 'Failed to get location items' };
    }
  }
}

export default ServerService; 