import { ServerConfig } from '../services/serverService';

export type SettingsStackParamList = {
  Settings: undefined;
  ServerConfig: { server?: ServerWithStatus };
  Appearance: undefined;
  InventorySettings: undefined;
};

export interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
} 