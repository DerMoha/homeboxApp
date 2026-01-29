import AsyncStorage from '@react-native-async-storage/async-storage';
import {storageService, STORAGE_KEYS} from '../storageService';

jest.mock('@react-native-async-storage/async-storage');

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItem()', () => {
    it('should get and parse item successfully', async () => {
      const testData = {name: 'Test', value: 123};
      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(testData),
      );

      const result = await storageService.getItem('test-key');

      expect(result).toEqual(testData);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storageService.getItem('non-existent');

      expect(result).toBeNull();
    });

    it('should return default value when key not found', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const defaultValue = {default: true};
      const result = await storageService.getItem('test-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should handle JSON parse errors', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce('invalid-json{');

      const result = await storageService.getItem('test-key');

      expect(result).toBeNull();
    });

    it('should handle storage errors', async () => {
      mockedAsyncStorage.getItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const result = await storageService.getItem('test-key');

      expect(result).toBeNull();
    });

    it('should return default value on error', async () => {
      mockedAsyncStorage.getItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const defaultValue = {fallback: true};
      const result = await storageService.getItem('test-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });
  });

  describe('setItem()', () => {
    it('should stringify and save item successfully', async () => {
      const testData = {name: 'Test', value: 123};
      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem('test-key', testData);

      expect(result).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
      );
    });

    it('should handle primitive values', async () => {
      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      await storageService.setItem('string-key', 'test-string');
      await storageService.setItem('number-key', 42);
      await storageService.setItem('boolean-key', true);

      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'string-key',
        JSON.stringify('test-string'),
      );
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'number-key',
        JSON.stringify(42),
      );
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'boolean-key',
        JSON.stringify(true),
      );
    });

    it('should handle storage errors', async () => {
      mockedAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage full'),
      );

      const result = await storageService.setItem('test-key', {data: 'test'});

      expect(result).toBe(false);
    });

    it('should handle null values', async () => {
      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem('test-key', null);

      expect(result).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(null),
      );
    });
  });

  describe('removeItem()', () => {
    it('should remove item successfully', async () => {
      mockedAsyncStorage.removeItem.mockResolvedValueOnce();

      const result = await storageService.removeItem('test-key');

      expect(result).toBe(true);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removal errors', async () => {
      mockedAsyncStorage.removeItem.mockRejectedValueOnce(
        new Error('Remove failed'),
      );

      const result = await storageService.removeItem('test-key');

      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear all storage successfully', async () => {
      mockedAsyncStorage.clear.mockResolvedValueOnce();

      const result = await storageService.clear();

      expect(result).toBe(true);
      expect(mockedAsyncStorage.clear).toHaveBeenCalled();
    });

    it('should handle clear errors', async () => {
      mockedAsyncStorage.clear.mockRejectedValueOnce(new Error('Clear failed'));

      const result = await storageService.clear();

      expect(result).toBe(false);
    });
  });

  describe('multiGet()', () => {
    it('should get multiple items successfully', async () => {
      const mockData = [
        ['key1', JSON.stringify({value: 1})],
        ['key2', JSON.stringify({value: 2})],
        ['key3', JSON.stringify({value: 3})],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockData as any);

      const result = await storageService.multiGet(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: {value: 1},
        key2: {value: 2},
        key3: {value: 3},
      });
    });

    it('should handle null values in multiGet', async () => {
      const mockData = [
        ['key1', JSON.stringify({value: 1})],
        ['key2', null],
        ['key3', JSON.stringify({value: 3})],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockData as any);

      const result = await storageService.multiGet(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: {value: 1},
        key2: null,
        key3: {value: 3},
      });
    });

    it('should handle parse errors in multiGet', async () => {
      const mockData = [
        ['key1', JSON.stringify({value: 1})],
        ['key2', 'invalid-json{'],
        ['key3', JSON.stringify({value: 3})],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockData as any);

      const result = await storageService.multiGet(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: {value: 1},
        key2: null,
        key3: {value: 3},
      });
    });

    it('should handle multiGet errors', async () => {
      mockedAsyncStorage.multiGet.mockRejectedValueOnce(
        new Error('MultiGet failed'),
      );

      const result = await storageService.multiGet(['key1', 'key2']);

      expect(result).toEqual({});
    });

    it('should handle empty keys array', async () => {
      mockedAsyncStorage.multiGet.mockResolvedValueOnce([]);

      const result = await storageService.multiGet([]);

      expect(result).toEqual({});
    });
  });

  describe('multiSet()', () => {
    it('should set multiple items successfully', async () => {
      mockedAsyncStorage.multiSet.mockResolvedValueOnce();

      const keyValuePairs: Array<[string, any]> = [
        ['key1', {value: 1}],
        ['key2', {value: 2}],
        ['key3', {value: 3}],
      ];

      const result = await storageService.multiSet(keyValuePairs);

      expect(result).toBe(true);
      expect(mockedAsyncStorage.multiSet).toHaveBeenCalledWith([
        ['key1', JSON.stringify({value: 1})],
        ['key2', JSON.stringify({value: 2})],
        ['key3', JSON.stringify({value: 3})],
      ]);
    });

    it('should handle multiSet errors', async () => {
      mockedAsyncStorage.multiSet.mockRejectedValueOnce(
        new Error('MultiSet failed'),
      );

      const result = await storageService.multiSet([['key1', {value: 1}]]);

      expect(result).toBe(false);
    });

    it('should handle empty array', async () => {
      mockedAsyncStorage.multiSet.mockResolvedValueOnce();

      const result = await storageService.multiSet([]);

      expect(result).toBe(true);
      expect(mockedAsyncStorage.multiSet).toHaveBeenCalledWith([]);
    });
  });

  describe('Theme mode persistence', () => {
    it('should save theme mode', async () => {
      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem(
        STORAGE_KEYS.THEME_MODE,
        'dark',
      );

      expect(result).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.THEME_MODE,
        JSON.stringify('dark'),
      );
    });

    it('should load theme mode', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify('dark'));

      const result = await storageService.getItem(STORAGE_KEYS.THEME_MODE);

      expect(result).toBe('dark');
    });

    it('should handle missing theme mode', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storageService.getItem(
        STORAGE_KEYS.THEME_MODE,
        'light',
      );

      expect(result).toBe('light');
    });
  });

  describe('Server credential storage', () => {
    it('should save server credentials', async () => {
      const serverConfig = {
        id: 'server-1',
        host: 'localhost:3000',
        username: 'user',
        password: 'pass',
      };

      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem(STORAGE_KEYS.SERVERS, [
        serverConfig,
      ]);

      expect(result).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SERVERS,
        JSON.stringify([serverConfig]),
      );
    });

    it('should load server credentials', async () => {
      const serverConfig = {
        id: 'server-1',
        host: 'localhost:3000',
        username: 'user',
        password: 'pass',
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify([serverConfig]),
      );

      const result = await storageService.getItem(STORAGE_KEYS.SERVERS);

      expect(result).toEqual([serverConfig]);
    });

    it('should save last used server ID', async () => {
      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem(
        STORAGE_KEYS.LAST_USED_SERVER_ID,
        'server-1',
      );

      expect(result).toBe(true);
    });
  });

  describe('Display preferences storage', () => {
    it('should save inventory display preferences', async () => {
      const preferences = {
        viewMode: 'grid',
        itemsPerRow: 2,
        sortBy: 'name',
      };

      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await storageService.setItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
        preferences,
      );

      expect(result).toBe(true);
    });

    it('should load inventory display preferences', async () => {
      const preferences = {
        viewMode: 'grid',
        itemsPerRow: 2,
        sortBy: 'name',
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(preferences),
      );

      const result = await storageService.getItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
      );

      expect(result).toEqual(preferences);
    });
  });

  describe('STORAGE_KEYS constants', () => {
    it('should have all required storage keys', () => {
      expect(STORAGE_KEYS.SERVERS).toBe('@servers');
      expect(STORAGE_KEYS.LAST_USED_SERVER_ID).toBe('@lastUsedServerId');
      expect(STORAGE_KEYS.THEME_MODE).toBe('@theme_mode');
      expect(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES).toBe(
        '@inventory_display_preferences',
      );
      expect(STORAGE_KEYS.CUSTOM_COLORS).toBe('@customColors');
    });
  });
});
