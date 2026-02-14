import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../utils/logger';

/**
 * Centralized storage service for type-safe AsyncStorage operations
 */

// Storage keys - centralized and type-safe
export const STORAGE_KEYS = {
  // Server & Connection
  SERVERS: '@servers',
  LAST_USED_SERVER_ID: '@lastUsedServerId',
  ACTIVE_SERVER: '@active_server',
  SAVED_SERVERS: '@saved_servers',

  // Display Preferences
  INVENTORY_DISPLAY_PREFERENCES: '@inventory_display_preferences',
  INVENTORY_VIEW_MODE: '@inventory_view_mode',
  INVENTORY_ITEMS_PER_ROW: '@inventory_items_per_row',
  INVENTORY_LIST_ZOOM: '@inventory_list_zoom',
  INVENTORY_SORT_OPTION: '@inventory_sort_option',
  INVENTORY_DISPLAY_MODE: '@inventory_displayMode',
  INVENTORY_SORT_BY: '@inventory_sortBy',
  INVENTORY_GROUP_BY: '@inventory_groupBy',
  INVENTORY_SHOW_ARCHIVED: '@inventory_showArchived',
  INVENTORY_FILTERS: '@inventory_filters',

  ADD_ITEM_FIELDS: '@add_item_fields',
  IMAGE_QUALITY: '@image_quality',

  // Theme
  THEME_MODE: '@theme_mode',
  CUSTOM_COLORS: '@customColors',

  // Haptics
  HAPTICS_ENABLED: '@haptics_enabled',
} as const;

class StorageService {
  /**
   * Get item from storage with type safety
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting item from storage (${key}):`, {error});
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in storage with type safety
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Error setting item in storage (${key}):`, {error});
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Error removing item from storage (${key}):`, {error});
      return false;
    }
  }

  /**
   * Clear all storage (use with caution!)
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      logger.error('Error clearing storage:', {error});
      return false;
    }
  }

  /**
   * Get multiple items at once
   */
  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      const data: Record<string, T | null> = {};

      result.forEach(([key, value]) => {
        if (value !== null) {
          try {
            data[key] = JSON.parse(value) as T;
          } catch {
            data[key] = null;
          }
        } else {
          data[key] = null;
        }
      });

      return data;
    } catch (error) {
      logger.error('Error getting multiple items from storage:', {error});
      return {};
    }
  }

  /**
   * Set multiple items at once
   */
  async multiSet(keyValuePairs: Array<[string, any]>): Promise<boolean> {
    try {
      const stringifiedPairs: Array<[string, string]> = keyValuePairs.map(
        ([key, value]) => [key, JSON.stringify(value)],
      );
      await AsyncStorage.multiSet(stringifiedPairs);
      return true;
    } catch (error) {
      logger.error('Error setting multiple items in storage:', {error});
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
