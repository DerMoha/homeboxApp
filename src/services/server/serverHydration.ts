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
  let migrationFailed = false;

  const hydratedServers = await Promise.all(
    servers.map(async server => {
      if (isLegacyServerConfig(server)) {
        migratedLegacyServers = true;
        const migrated = await secureStorageService.setServerPassword(
          server.id,
          server.password,
        );
        if (!migrated) {
          migrationFailed = true;
          return server;
        }

        // The password is intentionally not read back into application state.
        return {...server, password: ''};
      }

      return {
        ...server,
        password: '',
      };
    }),
  );

  if (migratedLegacyServers && !migrationFailed) {
    await storageService.setItem(
      STORAGE_KEYS.SERVERS,
      hydratedServers.map(server => toStoredServerConfig(server)),
    );
  }

  return hydratedServers;
};
