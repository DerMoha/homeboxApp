export type RootStackParamList = {
  Home: undefined;
  InventoryTab: {
    screen: 'Inventory' | 'ItemDetail';
    params?: (
      | {
          searchQuery?: string;
          selectedTags?: string[];
          selectedLocation?: string | null;
        }
      | { itemId: string }
    );
  };
  AddItemTab: { scanBarcode?: boolean };
  Locations: undefined;
  SettingsTab: undefined;
  ItemDetail: { itemId: string };
  LocationItems: { locationId: string };
  ServerConfig: { server?: { id: string; host: string; username: string; password: string; name?: string } };
  Appearance: undefined;
  InventorySettings: undefined;
  AddItemSettings: undefined;
  Inventory: {
    searchQuery?: string;
    selectedTags?: string[];
    selectedLocation?: string | null;
  };
  AddItem: { scanBarcode?: boolean };
  Settings: undefined;
};

export type LocationsStackParamList = {
  LocationsList: undefined;
  LocationItems: { locationId: string; locationName: string };
};

export interface ServerWithStatus {
  id: string;
  host: string;
  username: string;
  password: string;
  name?: string;
  status: 'checking' | 'online' | 'offline';
} 