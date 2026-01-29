import axios, {AxiosError} from 'axios';
import ServerService from '../serverService';
import {ServerConfig} from '../../types';
import {storageService, STORAGE_KEYS} from '../storageService';

// Mock dependencies
jest.mock('axios');
jest.mock('../storageService');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedStorageService = storageService as jest.Mocked<
  typeof storageService
>;

describe('ServerService', () => {
  let serverService: ServerService;
  let mockAxiosInstance: any;

  const mockConfig: ServerConfig = {
    id: 'test-server-1',
    host: 'localhost:3000',
    username: 'testuser',
    password: 'testpass',
    name: 'Test Server',
  };

  beforeEach(() => {
    // Reset singleton instance
    (ServerService as any).instance = undefined;
    serverService = ServerService.getInstance();

    // Setup axios mock instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError.mockReturnValue(true);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialize()', () => {
    it('should successfully authenticate and set token', async () => {
      const mockToken = 'test-token-123';
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: mockToken, user: {id: '1', username: 'testuser'}},
      });

      const result = await serverService.initialize(mockConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: mockToken,
        user: {id: '1', username: 'testuser'},
      });
      expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
        `Bearer ${mockToken}`,
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/users/login',
        {
          username: mockConfig.username,
          password: mockConfig.password,
        },
      );
    });

    it('should handle Bearer prefix in token correctly', async () => {
      const mockToken = 'Bearer test-token-123';
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: mockToken},
      });

      await serverService.initialize(mockConfig);

      // Should remove duplicate Bearer prefix
      expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
        'Bearer test-token-123',
      );
    });

    it('should handle invalid credentials (401)', async () => {
      const error = {
        response: {
          status: 401,
          data: {message: 'Invalid credentials'},
        },
        request: {},
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValueOnce(error);

      const result = await serverService.initialize(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should handle network errors', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValueOnce(error);

      const result = await serverService.initialize(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No response from server');
    });

    it('should handle missing token in response', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {user: {id: '1'}}, // No token
      });

      const result = await serverService.initialize(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get authentication token');
    });

    it('should add http:// protocol if not present', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });

      await serverService.initialize(mockConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3000',
        }),
      );
    });

    it('should not add protocol if already present', async () => {
      const configWithProtocol = {...mockConfig, host: 'https://example.com'};
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });

      await serverService.initialize(configWithProtocol);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://example.com',
        }),
      );
    });
  });

  describe('testConnection()', () => {
    it('should successfully test connection', async () => {
      const mockToken = 'test-token';
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: mockToken},
      });

      const result = await serverService.testConnection(mockConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({token: mockToken});
    });

    it('should handle connection failure', async () => {
      const error = {
        request: {},
        message: 'Connection refused',
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValueOnce(error);

      const result = await serverService.testConnection(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No response from server');
    });

    it('should handle authentication failure', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {}, // No token
      });

      const result = await serverService.testConnection(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to authenticate');
    });
  });

  describe('autoConnect()', () => {
    it('should restore last used server and connect', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('test-server-1');
      mockedStorageService.getItem.mockResolvedValueOnce([mockConfig]);

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });

      const result = await serverService.autoConnect();

      expect(result.success).toBe(true);
      expect(mockedStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LAST_USED_SERVER_ID,
      );
    });

    it('should handle no last used server', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce(null);

      const result = await serverService.autoConnect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No last used server found');
    });

    it('should handle server not found in saved servers', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('non-existent-id');
      mockedStorageService.getItem.mockResolvedValueOnce([mockConfig]);

      const result = await serverService.autoConnect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No last used server found');
    });
  });

  describe('Token handling', () => {
    it('should include token in subsequent requests', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {items: [], page: 1, pageSize: 50, total: 0},
      });

      await serverService.initialize(mockConfig);
      await serverService.getInventory();

      expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
        'Bearer test-token',
      );
    });

    it('should handle requests without active connection', async () => {
      const result = await serverService.getInventory();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active server connection');
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });
      await serverService.initialize(mockConfig);
    });

    it('should handle 401 Unauthorized', async () => {
      const error = {
        response: {
          status: 401,
          data: {message: 'Unauthorized'},
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      const result = await serverService.getInventory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should handle 403 Forbidden', async () => {
      const error = {
        response: {
          status: 403,
          data: {message: 'Forbidden'},
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      const result = await serverService.getInventory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      const result = await serverService.getInventory();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get inventory');
    });

    it('should handle invalid response format', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {invalid: 'format'}, // Missing items array
      });

      const result = await serverService.getInventory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format from server');
    });
  });

  describe('getItemById()', () => {
    beforeEach(async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {token: 'test-token'},
      });
      await serverService.initialize(mockConfig);
    });

    it('should fetch item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Test Item',
        quantity: 5,
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockItem,
      });

      const result = await serverService.getItemById('item-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItem);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/items/item-1',
      );
    });

    it('should handle item not found', async () => {
      const error = {
        response: {
          status: 404,
          data: {message: 'Item not found'},
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      const result = await serverService.getItemById('non-existent');

      expect(result.success).toBe(false);
    });
  });

  describe('Server management', () => {
    it('should save server configuration', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce([]);
      mockedStorageService.setItem.mockResolvedValueOnce(true);

      const result = await serverService.saveServer(mockConfig);

      expect(result).toBe(true);
      expect(mockedStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SERVERS,
        [mockConfig],
      );
    });

    it('should update existing server', async () => {
      const existingServers = [mockConfig];
      const updatedConfig = {...mockConfig, name: 'Updated Name'};

      mockedStorageService.getItem.mockResolvedValueOnce(existingServers);
      mockedStorageService.setItem.mockResolvedValueOnce(true);

      await serverService.saveServer(updatedConfig);

      expect(mockedStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SERVERS,
        [updatedConfig],
      );
    });

    it('should delete server', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce([mockConfig]);
      mockedStorageService.setItem.mockResolvedValueOnce(true);

      const result = await serverService.deleteServer('test-server-1');

      expect(result).toBe(true);
      expect(mockedStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SERVERS,
        [],
      );
    });

    it('should get all servers', async () => {
      const servers = [mockConfig];
      mockedStorageService.getItem.mockResolvedValueOnce(servers);

      const result = await serverService.getServers();

      expect(result).toEqual(servers);
    });

    it('should handle storage errors gracefully', async () => {
      mockedStorageService.getItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const result = await serverService.getServers();

      expect(result).toEqual([]);
    });
  });
});
