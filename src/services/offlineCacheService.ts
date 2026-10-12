import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'react-native-fs';
import {ApiResponse, Item} from '../types';
import {HOMEBOX_ENDPOINTS} from './server/homeboxAdapter';

interface Cached<T> {
  data: T;
  updatedAt: string;
}
const prefix = (server: string) => `@offline:${encodeURIComponent(server)}:`;
const images = new Map<string, Record<string, string>>();
const downloading = new Set<string>();

export const offlineCacheService = {
  async get<T>(server: string, key: string): Promise<Cached<T> | null> {
    try {
      return JSON.parse(
        (await AsyncStorage.getItem(prefix(server) + key)) || 'null',
      );
    } catch {
      return null;
    }
  },
  async set<T>(server: string, key: string, data: T) {
    const cached = {data, updatedAt: new Date().toISOString()};
    await AsyncStorage.setItem(prefix(server) + key, JSON.stringify(cached));
    return cached;
  },
  async read<T>(
    server: string | null,
    key: string,
    request: () => Promise<ApiResponse<T>>,
  ): Promise<ApiResponse<T>> {
    const result = await request().catch(
      () =>
        ({success: false, error: 'Connection unavailable'}) as ApiResponse<T>,
    );
    if (!server) {
      return result;
    }
    await this.loadImages(server);
    if (result.success && result.data !== undefined) {
      const updatedAt = new Date().toISOString();
      try {
        await this.set(server, key, result.data);
      } catch {
        /* Online reads still work when storage is full. */
      }
      return {...result, cachedAt: updatedAt, fromCache: false};
    }
    const cached = await this.get<T>(server, key);
    return cached
      ? {
          success: true,
          data: cached.data,
          fromCache: true,
          cachedAt: cached.updatedAt,
        }
      : result;
  },
  async loadImages(server: string) {
    if (images.has(server)) {
      return;
    }
    const stored = await this.get<Record<string, string>>(server, 'images');
    const valid: Record<string, string> = {};
    for (const [key, path] of Object.entries(stored?.data || {})) {
      if (await FS.exists(path)) {
        valid[key] = path;
      }
    }
    images.set(server, valid);
  },
  localImage(server: string, item: string, image: string) {
    const path = images.get(server)?.[`${item}:${image}`];
    return path ? `file://${path}` : null;
  },
  async cacheImages(
    server: string,
    items: Item[],
    baseUrl: string,
    headers: Record<string, string>,
  ) {
    if (downloading.has(server)) {
      return;
    }
    downloading.add(server);
    try {
      await this.loadImages(server);
      const directory = `${FS.CachesDirectoryPath}/inventory-${encodeURIComponent(server)}`;
      await FS.mkdir(directory);
      const records = images.get(server) || {};
      // Sequential downloads keep large inventories from overwhelming the server.
      for (const item of items) {
        if (!item.imageId) {
          continue;
        }
        const key = `${item.id}:${item.imageId}`;
        if (records[key] && (await FS.exists(records[key]))) {
          continue;
        }
        const path = `${directory}/${encodeURIComponent(key)}.image`;
        try {
          const result = await FS.downloadFile({
            fromUrl:
              baseUrl +
              HOMEBOX_ENDPOINTS.entityAttachment(item.id, item.imageId),
            toFile: path,
            headers,
          }).promise;
          if (result.statusCode === 200) {
            records[key] = path;
          }
        } catch {
          /* A missing thumbnail must not prevent offline text browsing. */
        }
      }
      images.set(server, records);
      await this.set(server, 'images', records);
    } finally {
      downloading.delete(server);
    }
  },
  async recordItem(server: string, item: Item | null, removedId?: string) {
    const id = item?.id || removedId;
    if (!id) {
      return;
    }
    if (item) {
      await this.set(server, `item:${id}`, item);
    } else {
      await AsyncStorage.removeItem(prefix(server) + `item:${id}`);
    }
    const keys = (await AsyncStorage.getAllKeys()).filter(
      key =>
        key.startsWith(prefix(server)) &&
        (key.includes(':inventory:') || key.includes(':location:')),
    );
    for (const key of keys) {
      const cached = JSON.parse(
        (await AsyncStorage.getItem(key)) || 'null',
      ) as Cached<{items: Item[]; total: number}> | null;
      if (!cached?.data?.items) {
        continue;
      }
      const previous = cached.data.items;
      const includes = previous.some(entry => entry.id === id);
      const resource = key.slice(prefix(server).length);
      const shouldInclude =
        item &&
        (resource === 'inventory:-1:-1' ||
          (resource.startsWith('location:') &&
            item.location?.id === resource.slice('location:'.length)) ||
          (!resource.startsWith('location:') && includes));
      const items = previous.filter(entry => entry.id !== id);
      if (shouldInclude && item) {
        items.push(item);
      }
      await AsyncStorage.setItem(
        prefix(server) + resource,
        JSON.stringify({
          ...cached,
          data: {
            ...cached.data,
            items,
            total: Math.max(
              0,
              cached.data.total +
                (shouldInclude && !includes
                  ? 1
                  : !shouldInclude && includes
                    ? -1
                    : 0),
            ),
          },
        }),
      );
    }
  },
  async clear(server: string) {
    const keys = (await AsyncStorage.getAllKeys()).filter(key =>
      key.startsWith(prefix(server)),
    );
    await AsyncStorage.removeMany(keys);
    images.delete(server);
    const directory = `${FS.CachesDirectoryPath}/inventory-${encodeURIComponent(server)}`;
    if (await FS.exists(directory)) {
      await FS.unlink(directory);
    }
  },
};
