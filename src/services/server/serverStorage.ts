import {secureStorageService} from '../secureStorageService';
import {storageService, STORAGE_KEYS} from '../storageService';
import {logger} from '../../utils/logger';
import {ServerConfig, StoredServerConfig} from '../../types';
import {hydrateServers, toStoredServerConfig} from './serverHydration';

export const getServers = async (): Promise<ServerConfig[]> => {
  try {
    const servers = await storageService.getItem<
      Array<StoredServerConfig | ServerConfig>
    >(STORAGE_KEYS.SERVERS);

    if (!servers?.length) {
      return [];
    }

    return hydrateServers(servers);
  } catch (error) {
    logger.error('Error getting servers', {error});
    return [];
  }
};

export const saveServer = async (config: ServerConfig): Promise<boolean> => {
  try {
    const servers = await getServers();
    const existingIndex = servers.findIndex(server => server.id === config.id);

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

    return storageService.setItem(
      STORAGE_KEYS.SERVERS,
      servers.map(server => toStoredServerConfig(server)),
    );
  } catch (error) {
    logger.error('Error saving server', {error});
    return false;
  }
};

export const deleteServer = async (serverId: string): Promise<boolean> => {
  try {
    const servers = await getServers();
    const updatedServers = servers.filter(server => server.id !== serverId);
    const storageUpdated = await storageService.setItem(
      STORAGE_KEYS.SERVERS,
      updatedServers.map(server => toStoredServerConfig(server)),
    );
    const passwordDeleted = await secureStorageService.removeServerPassword(
      serverId,
    );

    return storageUpdated && passwordDeleted;
  } catch (error) {
    logger.error('Error deleting server', {error});
    return false;
  }
};

export const getLastUsedServer = async (): Promise<ServerConfig | null> => {
  try {
    const lastUsedId = await storageService.getItem<string>(
      STORAGE_KEYS.LAST_USED_SERVER_ID,
    );

    if (!lastUsedId) {
      return null;
    }

    const servers = await getServers();
    return servers.find(server => server.id === lastUsedId) || null;
  } catch (error) {
    logger.error('Error getting last used server', {error});
    return null;
  }
};

export const setLastUsedServer = async (serverId: string): Promise<void> => {
  try {
    await storageService.setItem(STORAGE_KEYS.LAST_USED_SERVER_ID, serverId);
  } catch (error) {
    logger.error('Error setting last used server', {error});
  }
};
