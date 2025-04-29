import { ServerConfig } from '../services/serverService';

export type SettingsStackParamList = {
  Settings: undefined;
  ServerConfig: { server?: ServerWithStatus };
  Appearance: undefined;
  InventorySettings: undefined;
};

export type LocationsStackParamList = {
  LocationsList: undefined;
  LocationItems: { locationId: string; locationName: string };
};

export interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
} 