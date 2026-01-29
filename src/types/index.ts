/**
 * Unified type definitions for the application
 * Single source of truth for shared types
 */

// Location types
export interface Location {
  id: string;
  name: string;
  description: string;
  itemCount?: number;
  imageId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Label types
export interface Label {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Item types - unified definition
export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  location: Location | null;
  labels: Label[];
  archived: boolean;
  assetId: string;
  createdAt: string;
  updatedAt: string;
  imageId?: string | null;
  insured: boolean;
  purchasePrice: number;
}

// Inventory item (alias for backward compatibility)
export type InventoryItem = Item;

// Server response types
export interface ServerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Paginated response types
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface LocationResponse {
  locations: Location[];
  page: number;
  pageSize: number;
  total: number;
}

export type InventoryResponse = PaginatedResponse<Item>;

// Form data types
export interface CreateItemRequest {
  name: string;
  description?: string;
  quantity: number;
  locationId?: string;
  labels?: string[];
  purchasePrice?: number;
  insured?: boolean;
}

export interface EnabledFields {
  description: boolean;
  purchasePrice: boolean;
  insured: boolean;
  labels: boolean;
}

// Server configuration types
export interface ServerConfig {
  id: string;
  host: string;
  username: string;
  password: string;
  name?: string;
}

// Display preferences
export interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
}

// Sort options
export type SortOption =
  | 'name'
  | 'quantity'
  | 'createdAt'
  | 'updatedAt'
  | 'location';

// View modes
export type ViewMode = 'list' | 'grid';

// React Native FormData file type
export interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

// Filter types
export type InsuranceFilter = 'all' | 'insured' | 'uninsured';
export type DateRangeFilter = 'all' | 'week' | 'month' | 'quarter';

export interface FilterState {
  locationId: string | null;
  labelIds: string[];
  insuranceStatus: InsuranceFilter;
  quantityMin: number | null;
  quantityMax: number | null;
  dateRange: DateRangeFilter;
}
