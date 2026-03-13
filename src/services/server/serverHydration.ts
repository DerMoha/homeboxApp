import {secureStorageService} from '../secureStorageService';
import {storageService, STORAGE_KEYS} from '../storageService';
import {ServerConfig, StoredServerConfig} from '../../types';

export const toStoredServerConfig = (
  config: ServerConfig,
): StoredServerConfig => ({
  id: config.id,
  host: config.host,
  username: config.username,
  name: config.name,
});

export const isLegacyServerConfig = (
  server: StoredServerConfig | ServerConfig,
): server is ServerConfig =>
  'password' in server && typeof server.password === 'string';

export const hydrateServers = async (
  servers: Array<StoredServerConfig | ServerConfig>,
): Promise<ServerConfig[]> => {
  let migratedLegacyServers = false;

  const hydratedServers = await Promise.all(
    servers.map(async server => {
      if (isLegacyServerConfig(server)) {
        migratedLegacyServers = true;
        await secureStorageService.setServerPassword(
          server.id,
          server.password,
        );
        return server;
      }

      const password = await secureStorageService.getServerPassword(server.id);
      return {
        ...server,
        password: password ?? '',
      };
    }),
  );

  if (migratedLegacyServers) {
    await storageService.setItem(
      STORAGE_KEYS.SERVERS,
      hydratedServers.map(server => toStoredServerConfig(server)),
    );
  }

  return hydratedServers;
};
