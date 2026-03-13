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
  testServerAuthentication,
} from './server/serverAuth';
import {
  deleteServer,
  getLastUsedServer,
  getServers,
  saveServer,
  setLastUsedServer,
} from './server/serverStorage';
import {toBootstrapError} from './server/serverErrors';
import {normalizeServerHost} from './server/serverHost';
import {
  getLocationItems,
  getLocations,
  getLocationTree,
} from './server/serverApi/locationsApi';
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
    return getItemById(this.axiosInstance, this.token, id);
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
      this.axiosInstance = createAxiosClient(normalizedHost);

      const authResult = await authenticateServer(this.axiosInstance, config);
      if (!authResult.success) {
        return {success: false, error: authResult.error};
      }

      this.token = authResult.token;
      applyAuthorizationHeader(this.axiosInstance, authResult.token);

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
      const authResult = await testServerAuthentication(testInstance, config);

      if (!authResult.success) {
        return {success: false, error: authResult.error};
      }

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
    return deleteServer(serverId);
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
    return getInventory(this.axiosInstance, this.token, page, pageSize);
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
    return getLocations(this.axiosInstance, this.token);
  }

  async getLabels(): Promise<ApiResponse<Label[]>> {
    return getLabels(this.axiosInstance, this.token);
  }

  async getLocationItems(
    locationId: string,
  ): Promise<ApiResponse<InventoryResponse>> {
    return getLocationItems(this.axiosInstance, locationId);
  }

  async getLocationTree(): Promise<ApiResponse<TreeNode[]>> {
    return getLocationTree(this.axiosInstance);
  }

  buildLocationPath(
    tree: TreeNode[],
    targetLocationId: string,
  ): {id: string; name: string}[] {
    return buildLocationPath(tree, targetLocationId);
  }

  async createItem(item: CreateItemRequest): Promise<CreateItemResponse> {
    return createItem(this.axiosInstance, item);
  }

  async updateItem(item: UpdateItemRequest): Promise<CreateItemResponse> {
    return updateItem(this.axiosInstance, item);
  }

  async uploadItemImage(
    itemId: string,
    formData: FormData,
  ): Promise<ApiResponse<Item>> {
    return uploadItemImage(this.axiosInstance, itemId, formData);
  }

  async deleteItem(itemId: string): Promise<ApiResponse> {
    return deleteItem(this.axiosInstance, itemId);
  }
}

export type {TreeNode} from './server/types';
export default ServerService;
