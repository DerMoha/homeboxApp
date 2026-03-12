import * as Keychain from 'react-native-keychain';
import {logger} from '../utils/logger';

const SERVER_SECRET_SERVICE_PREFIX = 'homebox.server.';
const SERVER_SECRET_USERNAME = 'homebox';

const getServiceKey = (serverId: string) =>
  `${SERVER_SECRET_SERVICE_PREFIX}${serverId}`;

class SecureStorageService {
  async getServerPassword(serverId: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: getServiceKey(serverId),
      });

      return credentials ? credentials.password : null;
    } catch (error) {
      logger.error('Error loading server secret', {error, serverId});
      return null;
    }
  }

  async setServerPassword(
    serverId: string,
    password: string,
  ): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(SERVER_SECRET_USERNAME, password, {
        service: getServiceKey(serverId),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      logger.error('Error saving server secret', {error, serverId});
      return false;
    }
  }

  async removeServerPassword(serverId: string): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({
        service: getServiceKey(serverId),
      });
      return true;
    } catch (error) {
      logger.error('Error deleting server secret', {error, serverId});
      return false;
    }
  }
}

export const secureStorageService = new SecureStorageService();
