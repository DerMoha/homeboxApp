import axios, {AxiosInstance, AxiosError} from 'axios';
import {storageService, STORAGE_KEYS} from './storageService';
import {secureStorageService} from './secureStorageService';
import {logger} from '../utils/logger';
import {
  ServerConfig,
  StoredServerConfig,
  ApiResponse,
  Location,
  LocationResponse,
  Label,
  InventoryResponse,
  CreateItemRequest,
  UpdateItemRequest,
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

export interface TreeNode {
  id: string;
  name?: string;
  children?: TreeNode[];
  items?: Item[];
  [key: string]: unknown;
}

const HTTP_PROTOCOL = 'http://';
const HTTPS_PROTOCOL = 'https://';

const isIpv4Address = (value: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value);

const isPrivateIpv4Address = (value: string) => {
  if (!isIpv4Address(value)) {
    return false;
  }

  const octets = value.split('.').map(Number);

  if (octets.some(octet => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  );
};

const isPrivateHost = (hostname: string) => {
  const normalizedHost = hostname.toLowerCase();

  return (
    normalizedHost === 'localhost' ||
    normalizedHost === '::1' ||
    normalizedHost === '[::1]' ||
    normalizedHost.endsWith('.local') ||
    isPrivateIpv4Address(normalizedHost) ||
    !normalizedHost.includes('.')
  );
};

const extractHostname = (input: string) => {
  try {
    return new URL(`${HTTP_PROTOCOL}${input}`).hostname;
  } catch {
    return '';
  }
};

const normalizeServerHost = (input: string) => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('Please enter a server address');
  }

  const hasExplicitProtocol = /^https?:\/\//i.test(trimmedInput);
  const hostname = hasExplicitProtocol
    ? new URL(trimmedInput).hostname
    : extractHostname(trimmedInput);

  const baseUrl = hasExplicitProtocol
    ? trimmedInput
    : `${
        isPrivateHost(hostname) ? HTTP_PROTOCOL : HTTPS_PROTOCOL
      }${trimmedInput}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error('Please enter a valid server address');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Server address must use http or https');
  }

  if (parsedUrl.protocol === 'http:' && !isPrivateHost(parsedUrl.hostname)) {
    throw new Error('HTTP is only supported for local or private servers');
  }

  const normalizedPath = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
  return `${parsedUrl.protocol}//${parsedUrl.host}${normalizedPath}`.replace(
    /\/+$/,
    '',
  );
};

class ServerService {
  // ...existing fields and methods...

  /**
   * Fetch a single inventory item by its ID
   * @param id The item ID
   * @returns ApiResponse with the item details
   */
  public async getItemById(id: string): Promise<ApiResponse<Item>> {
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

  public async initialize(config: ServerConfig): Promise<ApiResponse> {
    try {
      const normalizedHost = normalizeServerHost(config.host);
      this.currentConfig = config;
      this.axiosInstance = axios.create(this.createAxiosConfig(normalizedHost));

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

  public async testConnection(config: ServerConfig): Promise<ApiResponse> {
    try {
      const normalizedHost = normalizeServerHost(config.host);
      const testInstance = axios.create(this.createAxiosConfig(normalizedHost));

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
      const servers = await storageService.getItem<
        Array<StoredServerConfig | ServerConfig>
      >(STORAGE_KEYS.SERVERS);

      if (!servers?.length) {
        return [];
      }

      return this.hydrateServers(servers);
    } catch (error) {
      logger.error('Error getting servers', {error});
      return [];
    }
  }

  public async saveServer(config: ServerConfig): Promise<boolean> {
    try {
      const servers = await this.getServers();
      const existingIndex = servers.findIndex(s => s.id === config.id);
      const storedConfig = this.toStoredServerConfig(config);

      if (existingIndex >= 0) {
        servers[existingIndex] = config;
      } else {
        servers.push(config);
      }

      const passwordSaved = await secureStorageService.setServerPassword(
        config.id,
        config.password,
      );

      if (!passwordSaved) {
        return false;
      }

      const storedServers = servers.map(server =>
        server.id === config.id
          ? storedConfig
          : this.toStoredServerConfig(server),
      );

      return await storageService.setItem(STORAGE_KEYS.SERVERS, storedServers);
    } catch (error) {
      logger.error('Error saving server', {error});
      return false;
    }
  }

  public async deleteServer(serverId: string): Promise<boolean> {
    try {
      const servers = await this.getServers();
      const updatedServers = servers.filter(s => s.id !== serverId);
      const storageUpdated = await storageService.setItem(
        STORAGE_KEYS.SERVERS,
        updatedServers.map(server => this.toStoredServerConfig(server)),
      );

      const passwordDeleted = await secureStorageService.removeServerPassword(
        serverId,
      );

      return storageUpdated && passwordDeleted;
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

    return normalizeServerHost(this.currentConfig.host);
  }

  public getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  public async getInventory(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<ApiResponse<InventoryResponse>> {
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

  public async autoConnect(): Promise<ApiResponse> {
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

  private handleError(error: AxiosError): ApiResponse {
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

  private createAxiosConfig(baseURL: string) {
    return {
      baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  private toStoredServerConfig(config: ServerConfig): StoredServerConfig {
    return {
      id: config.id,
      host: config.host,
      username: config.username,
      name: config.name,
    };
  }

  private isLegacyServerConfig(
    server: StoredServerConfig | ServerConfig,
  ): server is ServerConfig {
    return 'password' in server && typeof server.password === 'string';
  }

  private async hydrateServers(
    servers: Array<StoredServerConfig | ServerConfig>,
  ): Promise<ServerConfig[]> {
    let migratedLegacyServers = false;

    const hydratedServers = await Promise.all(
      servers.map(async server => {
        if (this.isLegacyServerConfig(server)) {
          migratedLegacyServers = true;
          await secureStorageService.setServerPassword(
            server.id,
            server.password,
          );
          return server;
        }

        const password = await secureStorageService.getServerPassword(
          server.id,
        );
        return {
          ...server,
          password: password ?? '',
        };
      }),
    );

    if (migratedLegacyServers) {
      await storageService.setItem(
        STORAGE_KEYS.SERVERS,
        hydratedServers.map(server => this.toStoredServerConfig(server)),
      );
    }

    return hydratedServers;
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

  async getLocationTree(): Promise<ApiResponse<TreeNode[]>> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        return {success: false, error: 'No active server connection'};
      }
      const response = await axiosInstance.get('/api/v1/locations/tree');
      return {success: true, data: response.data};
    } catch (error) {
      logger.error('Error getting location tree', {error});
      return {success: false, error: 'Failed to get location tree'};
    }
  }

  buildLocationPath(
    tree: TreeNode[],
    targetLocationId: string,
  ): {id: string; name: string}[] {
    const path: {id: string; name: string}[] = [];

    const findPath = (nodes: TreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          path.unshift({id: node.id, name: node.name || 'Unknown'});
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId)) {
            path.unshift({id: node.id, name: node.name || 'Unknown'});
            return true;
          }
        }
      }
      return false;
    };

    findPath(tree, targetLocationId);
    return path;
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

  async updateItem(item: UpdateItemRequest): Promise<CreateItemResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        throw new Error('No active server connection');
      }

      const {id, ...payload} = item;
      const response = await axiosInstance.put(`/api/v1/items/${id}`, payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      logger.error('Error updating item', {error});
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update item',
      };
    }
  }

  async uploadItemImage(
    itemId: string,
    formData: FormData,
  ): Promise<ApiResponse<Item>> {
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

  async deleteItem(itemId: string): Promise<ApiResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      if (!axiosInstance) {
        return {success: false, error: 'No active server connection'};
      }
      await axiosInstance.delete(`/api/v1/items/${itemId}`);
      return {success: true};
    } catch (error: unknown) {
      logger.error('Error deleting item', {error});
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.message ||
            error.message ||
            'Failed to delete item',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete item',
      };
    }
  }
}

export default ServerService;
