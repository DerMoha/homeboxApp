import {AxiosInstance, AxiosError} from 'axios';
import {
  ServerConfig,
  ApiResponse,
  LocationResponse,
  Label,
  InventoryResponse,
  CreateItemRequest,
  UpdateItemRequest,
  Item,
} from '../types';
import {
  applyAuthorizationHeader,
  authenticateServer,
  createAxiosClient,
  logoutServer,
} from './server/serverAuth';
import {
  deleteServer,
  getLastUsedServer,
  getServers,
  saveServer,
  setLastUsedServer,
} from './server/serverStorage';
import {offlineCacheService} from './offlineCacheService';
import {secureStorageService} from './secureStorageService';
import {toBootstrapError} from './server/serverErrors';
import {normalizeServerHost} from './server/serverHost';
import {
  getLocationItems,
  getLocations,
  getLocationTree,
} from './server/serverApi/locationsApi';
import {createLocation, createLabel} from './server/serverApi/metadataApi';
import {getLabels} from './server/serverApi/labelsApi';
import {
  createItem,
  deleteItem,
  getInventory,
  getItemById,
  updateItem,
  uploadItemImage,
} from './server/serverApi/inventoryApi';
import {buildLocationPath} from './server/locationTree';
import {CreateItemResponse, TreeNode} from './server/types';

class ServerService {
  public async getItemById(id: string): Promise<ApiResponse<Item>> {
    const config = this.getBrowsingConfig();
    const response = await offlineCacheService.read(
      config?.id || null,
      `item:${id}`,
      () => getItemById(this.axiosInstance, this.token, id),
    );
    if (response.success) {
      return response;
    }
    if (config) {
      const inventory = await offlineCacheService.get<InventoryResponse>(
        config.id,
        'inventory:-1:-1',
      );
      const item = inventory?.data.items.find(entry => entry.id === id);
      if (item) {
        return {
          success: true,
          data: item,
          fromCache: true,
          summaryOnly: true,
          cachedAt: inventory?.updatedAt,
        };
      }
    }
    return response;
  }

  private static instance: ServerService;
  private axiosInstance: AxiosInstance | null = null;
  private currentConfig: Omit<ServerConfig, 'password'> | null = null;
  private token: string | null = null;
  private browsingConfig: Omit<ServerConfig, 'password'> | null = null;

  public async browseOffline(config: ServerConfig): Promise<void> {
    await this.disconnect();
    const {password: _password, ...safeConfig} = config;
    this.browsingConfig = safeConfig;
    await this.setLastUsedServer(config.id);
  }

  public getBrowsingConfig() {
    return this.currentConfig || this.browsingConfig;
  }

  private constructor() {}

  public static getInstance(): ServerService {
    if (!ServerService.instance) {
      ServerService.instance = new ServerService();
    }
    return ServerService.instance;
  }

  public async initialize(config: ServerConfig): Promise<ApiResponse> {
    try {
      if (!this.currentConfig) {
        const {password: _password, ...safeConfig} = config;
        this.browsingConfig = safeConfig;
      }
      const normalizedHost = normalizeServerHost(config.host);
      const nextAxiosInstance = createAxiosClient(normalizedHost);
      const password =
        config.password ||
        (await secureStorageService.getServerPassword(config.id)) ||
        '';

      if (!password) {
        return {
          success: false,
          error: 'A password is required to connect to this server.',
        };
      }

      const authResult = await authenticateServer(nextAxiosInstance, {
        ...config,
        password,
      });
      if (!authResult.success) {
        return {success: false, error: authResult.error};
      }

      const previousAxiosInstance = this.axiosInstance;
      const previousToken = this.token;
      this.axiosInstance = nextAxiosInstance;
      this.currentConfig = {
        id: config.id,
        host: config.host,
        username: config.username,
        name: config.name,
      };
      this.token = authResult.token;
      applyAuthorizationHeader(nextAxiosInstance, authResult.token);

      if (previousAxiosInstance && previousToken) {
        await logoutServer(previousAxiosInstance);
      }

      return {
        success: true,
        data: authResult.data,
      };
    } catch (error) {
      return toBootstrapError(error as AxiosError);
    }
  }

  public async testConnection(config: ServerConfig): Promise<ApiResponse> {
    try {
      const normalizedHost = normalizeServerHost(config.host);
      const testInstance = createAxiosClient(normalizedHost);
      const password =
        config.password ||
        (await secureStorageService.getServerPassword(config.id)) ||
        '';

      if (!password) {
        return {
          success: false,
          error: 'A password is required to connect to this server.',
        };
      }

      const authResult = await authenticateServer(testInstance, {
        ...config,
        password,
      });

      if (!authResult.success) {
        return {success: false, error: authResult.error};
      }

      applyAuthorizationHeader(testInstance, authResult.token);
      await logoutServer(testInstance);

      return {success: true, data: authResult.data};
    } catch (error) {
      return toBootstrapError(error as AxiosError);
    }
  }

  public async getServers(): Promise<ServerConfig[]> {
    return getServers();
  }

  public async saveServer(config: ServerConfig): Promise<boolean> {
    return saveServer(config);
  }

  public async deleteServer(serverId: string): Promise<boolean> {
    const isCurrentServer = this.currentConfig?.id === serverId;
    const result = await deleteServer(serverId);
    if (result) {
      await offlineCacheService.clear(serverId);
      if (this.browsingConfig?.id === serverId) {
        this.browsingConfig = null;
      }
    }
    if (result && isCurrentServer) {
      await this.disconnect();
    }
    return result;
  }

  public async disconnect(): Promise<void> {
    const activeAxiosInstance = this.axiosInstance;
    const activeToken = this.token;

    try {
      if (activeAxiosInstance && activeToken) {
        await logoutServer(activeAxiosInstance);
      }
    } finally {
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    this.token = null;
    this.currentConfig = null;
    this.browsingConfig = null;
    if (this.axiosInstance) {
      delete this.axiosInstance.defaults.headers.common.Authorization;
      this.axiosInstance = null;
    }
  }

  public getCurrentConfig(): Omit<ServerConfig, 'password'> | null {
    return this.currentConfig;
  }

  public getBaseUrl(): string {
    const config = this.getBrowsingConfig();
    if (!config) {
      throw new Error('No active server configuration');
    }
    return normalizeServerHost(config.host);
  }

  public getAuthHeaders(): Record<string, string> {
    return this.token ? {Authorization: `Bearer ${this.token}`} : {};
  }

  public async getInventory(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<ApiResponse<InventoryResponse>> {
    const config = this.getBrowsingConfig();
    let response = await offlineCacheService.read(
      config?.id || null,
      `inventory:${page}:${pageSize}`,
      () => getInventory(this.axiosInstance, this.token, page, pageSize),
    );
    if (config && !response.success) {
      const full = await offlineCacheService.get<InventoryResponse>(
        config.id,
        'inventory:-1:-1',
      );
      if (full) {
        const items =
          pageSize > 0
            ? full.data.items.slice(
                Math.max(0, page - 1) * pageSize,
                Math.max(0, page - 1) * pageSize + pageSize,
              )
            : full.data.items;
        response = {
          success: true,
          data: {...full.data, items, page, pageSize},
          fromCache: true,
          cachedAt: full.updatedAt,
        };
      }
    }
    if (config && response.success && response.data && !response.fromCache) {
      offlineCacheService
        .cacheImages(
          config.id,
          response.data.items,
          this.getBaseUrl(),
          this.getAuthHeaders(),
        )
        .catch(() => undefined);
    }
    return response;
  }

  public async getLastUsedServer(): Promise<ServerConfig | null> {
    return getLastUsedServer();
  }

  public async setLastUsedServer(serverId: string): Promise<void> {
    await setLastUsedServer(serverId);
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
      return toBootstrapError(error as AxiosError);
    }
  }

  async getLocations(): Promise<ApiResponse<LocationResponse>> {
    return offlineCacheService.read(
      this.getBrowsingConfig()?.id || null,
      'locations',
      () => getLocations(this.axiosInstance, this.token),
    );
  }

  async createLocation(
    name: string,
    description = '',
    parentId: string | null = null,
  ) {
    const result = await createLocation(
      this.axiosInstance,
      name,
      description,
      parentId,
    );
    if (result.success) {
      await Promise.all([this.getLocations(), this.getLocationTree()]);
    }
    return result;
  }

  async createLabel(name: string, description = '') {
    const result = await createLabel(this.axiosInstance, name, description);
    if (result.success) {
      await this.getLabels();
    }
    return result;
  }

  async getLabels(): Promise<ApiResponse<Label[]>> {
    return offlineCacheService.read(
      this.getBrowsingConfig()?.id || null,
      'labels',
      () => getLabels(this.axiosInstance, this.token),
    );
  }

  async getLocationItems(
    locationId: string,
  ): Promise<ApiResponse<InventoryResponse>> {
    const config = this.getBrowsingConfig();
    const result = await offlineCacheService.read(
      config?.id || null,
      `location:${locationId}`,
      () => getLocationItems(this.axiosInstance, locationId),
    );
    if (!result.success && config) {
      const full = await offlineCacheService.get<InventoryResponse>(
        config.id,
        'inventory:-1:-1',
      );
      if (full) {
        const items = full.data.items.filter(
          item => item.location?.id === locationId,
        );
        return {
          success: true,
          data: {items, total: items.length, page: 1, pageSize: items.length},
          fromCache: true,
          cachedAt: full.updatedAt,
        };
      }
    }
    return result;
  }

  async getLocationTree(): Promise<ApiResponse<TreeNode[]>> {
    return offlineCacheService.read(
      this.getBrowsingConfig()?.id || null,
      'tree',
      () => getLocationTree(this.axiosInstance),
    );
  }

  buildLocationPath(
    tree: TreeNode[],
    targetLocationId: string,
  ): {id: string; name: string}[] {
    return buildLocationPath(tree, targetLocationId);
  }

  async createItem(item: CreateItemRequest): Promise<CreateItemResponse> {
    const serverId = this.currentConfig?.id;
    const result = await createItem(this.axiosInstance, item);
    if (serverId && result.success && result.data) {
      await offlineCacheService
        .recordItem(serverId, result.data)
        .catch(() => undefined);
    }
    return result;
  }

  async updateItem(item: UpdateItemRequest): Promise<CreateItemResponse> {
    const serverId = this.currentConfig?.id;
    const result = await updateItem(this.axiosInstance, item);
    if (serverId && result.success && result.data) {
      await offlineCacheService
        .recordItem(serverId, result.data)
        .catch(() => undefined);
    }
    return result;
  }

  async uploadItemImage(
    itemId: string,
    formData: FormData,
  ): Promise<ApiResponse<Item>> {
    const serverId = this.currentConfig?.id;
    const result = await uploadItemImage(this.axiosInstance, itemId, formData);
    if (serverId && result.success && result.data) {
      await offlineCacheService
        .recordItem(serverId, result.data)
        .catch(() => undefined);
    }
    return result;
  }

  async deleteItem(itemId: string): Promise<ApiResponse> {
    const serverId = this.currentConfig?.id;
    const result = await deleteItem(this.axiosInstance, itemId);
    if (serverId && result.success) {
      await offlineCacheService
        .recordItem(serverId, null, itemId)
        .catch(() => undefined);
    }
    return result;
  }
}

export type {TreeNode} from './server/types';
export default ServerService;
