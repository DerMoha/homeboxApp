import axios, {AxiosInstance, AxiosError} from 'axios';
import {storageService, STORAGE_KEYS} from './storageService';
import {logger} from '../utils/logger';
import {
  ServerConfig,
  ServerResponse,
  ApiResponse,
  Location,
  LocationResponse,
  Label,
  InventoryResponse,
  CreateItemRequest,
  Item,
} from '../types';

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

interface CreateItemResponse {
  success: boolean;
  data?: Item;
  error?: string;
}

class ServerService {
  // ...existing fields and methods...

  /**
   * Fetch a single inventory item by its ID
   * @param id The item ID
   * @returns ServerResponse with the item details
   */
  public async getItemById(id: string): Promise<ServerResponse> {
    try {
      if (!this.axiosInstance || !this.token) {
        return {
          success: false,
          error: 'No active server connection or authentication token',
        };
      }
      const response = await this.axiosInstance.get(`/api/v1/items/${id}`);
      if (!response.data || !response.data.id) {
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
          return {success: false, error: 'Authentication required'};
        }
        if (error.response?.status === 403) {
          return {success: false, error: 'Access denied'};
        }
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to get item',
        };
      }
      return {success: false, error: 'An unexpected error occurred'};
    }
  }

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
      const loginResponse = await this.axiosInstance.post(
        '/api/v1/users/login',
        {
          username: config.username,
          password: config.password,
        },
      );

      if (loginResponse.data && loginResponse.data.token) {
        this.token = loginResponse.data.token;
        // Ensure we don't have duplicate 'Bearer' in the token
        const cleanToken =
          this.token && this.token.startsWith('Bearer ')
            ? this.token.substring(7)
            : this.token;
        this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${cleanToken}`;
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
      const servers = await storageService.getItem<ServerConfig[]>(
        STORAGE_KEYS.SERVERS,
      );
      return servers || [];
    } catch (error) {
      logger.error('Error getting servers', {error});
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

      return await storageService.setItem(STORAGE_KEYS.SERVERS, servers);
    } catch (error) {
      logger.error('Error saving server', {error});
      return false;
    }
  }

  public async deleteServer(serverId: string): Promise<boolean> {
    try {
      const servers = await this.getServers();
      const updatedServers = servers.filter(s => s.id !== serverId);
      return await storageService.setItem(STORAGE_KEYS.SERVERS, updatedServers);
    } catch (error) {
      logger.error('Error deleting server', {error});
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
    const protocol = this.currentConfig.host.startsWith('http')
      ? ''
      : 'http://';
    return `${protocol}${this.currentConfig.host}`;
  }

  public getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  public async getInventory(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<ServerResponse<InventoryResponse>> {
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
          pageSize,
        },
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
          return {success: false, error: 'Authentication required'};
        }
        if (error.response?.status === 403) {
          return {success: false, error: 'Access denied'};
        }
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to get inventory',
        };
      }
      return {success: false, error: 'An unexpected error occurred'};
    }
  }

  public async getLastUsedServer(): Promise<ServerConfig | null> {
    try {
      const lastUsedId = await storageService.getItem<string>(
        STORAGE_KEYS.LAST_USED_SERVER_ID,
      );
      if (!lastUsedId) {
        return null;
      }

      const servers = await this.getServers();
      return servers.find(server => server.id === lastUsedId) || null;
    } catch (error) {
      logger.error('Error getting last used server', {error});
      return null;
    }
  }

  public async setLastUsedServer(serverId: string): Promise<void> {
    try {
      await storageService.setItem(STORAGE_KEYS.LAST_USED_SERVER_ID, serverId);
    } catch (error) {
      logger.error('Error setting last used server', {error});
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
        error: `Server error: ${error.response.status} - ${
          errorData.message || 'Unknown error'
        }`,
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
      total: locations.length,
    };
  }

  /**
   * Fetches locations from the server
   * @returns Promise containing the locations data or an error
   */
  async getLocations(): Promise<ApiResponse<LocationResponse>> {
    try {
      if (!this.axiosInstance || !this.token) {
        return {
          success: false,
          error: 'No active server connection or authentication token',
        };
      }

      const response = await this.axiosInstance.get('/api/v1/locations');
      return {
        success: true,
        data: this.transformLocationsResponse(response.data),
      };
    } catch (error) {
      return this.handleError(
        error as AxiosError,
      ) as ApiResponse<LocationResponse>;
    }
  }

  async getLabels(): Promise<ApiResponse<Label[]>> {
    try {
      if (!this.axiosInstance || !this.token) {
        return {
          success: false,
          error: 'No active server connection or authentication token',
        };
      }

      const response = await this.axiosInstance.get('/api/v1/labels');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError) as ApiResponse<Label[]>;
    }
  }

  async getLocationItems(
    locationId: string,
  ): Promise<ApiResponse<InventoryResponse>> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        return {success: false, error: 'No active server connection'};
      }
      const response = await axiosInstance.get('/api/v1/locations/tree');
      const tree = response.data;
      // Helper to recursively search for the location
      interface TreeNode {
        id: string;
        children?: TreeNode[];
        items?: Item[];
        [key: string]: unknown;
      }

      function findLocation(node: TreeNode, id: string): TreeNode | null {
        if (node.id === id) {
          return node;
        }
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findLocation(child, id);
            if (found) {
              return found;
            }
          }
        }
        return null;
      }
      let locationNode: TreeNode | null = null;
      if (Array.isArray(tree)) {
        // If root is array, search each root node
        for (const node of tree) {
          locationNode = findLocation(node, locationId);
          if (locationNode) {
            break;
          }
        }
      } else {
        // If root is object, search from root
        locationNode = findLocation(tree, locationId);
      }
      // Try to get items from the node
      let items: Item[] =
        locationNode && locationNode.items ? locationNode.items : [];
      if (!items.length) {
        const itemsResponse = await axiosInstance.get('/api/v1/items', {
          params: {page: 1, pageSize: 1000},
        });
        const allItems = itemsResponse.data.items || [];
        items = allItems.filter(
          (item: Item) => item.location && item.location.id === locationId,
        );
      }
      const inventoryResponse: InventoryResponse = {
        items: items,
        page: 1,
        pageSize: items.length,
        total: items.length,
      };
      return {success: true, data: inventoryResponse};
    } catch (error) {
      logger.error('Error getting location items', {error});
      return {success: false, error: 'Failed to get location items'};
    }
  }

  async createItem(item: CreateItemRequest): Promise<CreateItemResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        throw new Error('No active server connection');
      }
      const response = await axiosInstance.post('/api/v1/items', item);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      logger.error('Error creating item', {error});
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create item',
      };
    }
  }

  async uploadItemImage(
    itemId: string,
    formData: FormData,
  ): Promise<ServerResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        throw new Error('No active server connection');
      }
      logger.log('Uploading image', {
        path: `/api/v1/items/${itemId}/attachments`,
      });
      const response = await axiosInstance.post(
        `/api/v1/items/${itemId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      logger.log('Upload response received');
      return {success: true, data: response.data};
    } catch (error: unknown) {
      logger.error('Error uploading image', {error});
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.message ||
            error.message ||
            'Failed to upload image',
        };
      }
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }
}

export default ServerService;
