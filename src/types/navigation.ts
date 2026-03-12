import {NavigatorScreenParams} from '@react-navigation/native';
import {ServerConfig} from '../types';

export type SettingsStackParamList = {
  Settings: undefined;
  ServerConfig: {server?: ServerWithStatus};
  Appearance: undefined;
  InventorySettings: undefined;
  AddItemSettings: undefined;
};

export type LocationsStackParamList = {
  LocationsList: undefined;
  LocationItems: {locationId: string; locationName: string};
};

export type InventoryStackParamList = {
  Inventory: undefined;
  ItemDetail: {itemId: string};
};

export type AddItemStackParamList = {
  AddItem: {barcode?: string; itemId?: string} | undefined;
};

export type RootTabParamList = {
  Home: undefined;
  InventoryTab: NavigatorScreenParams<InventoryStackParamList> | undefined;
  AddItemTab: NavigatorScreenParams<AddItemStackParamList> | undefined;
  Locations: NavigatorScreenParams<LocationsStackParamList> | undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

export interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
}
