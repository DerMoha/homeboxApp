import {Item} from '../../types';

export interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export interface CreateItemResponse {
  success: boolean;
  data?: Item;
  error?: string;
}

export interface TreeNode {
  id: string;
  name?: string;
  type?: string;
  children?: TreeNode[];
  items?: Item[];
  [key: string]: unknown;
}

export interface EntityTypeSummary {
  id: string;
  name: string;
  isLocation?: boolean;
  [key: string]: unknown;
}

export interface TagSummary {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EntitySummary {
  id: string;
  name?: string;
  description?: string;
  quantity?: number;
  archived?: boolean;
  insured?: boolean;
  assetId?: string;
  imageId?: string | null;
  thumbnailId?: string | null;
  itemCount?: number;
  purchasePrice?: number;
  createdAt?: string;
  updatedAt?: string;
  parent?: EntitySummary | null;
  location?: EntitySummary | null;
  entityType?: EntityTypeSummary | null;
  tags?: TagSummary[];
  notes?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseFrom?: string;
  soldDate?: string;
  soldTo?: string;
  soldPrice?: number;
  soldNotes?: string;
  warrantyExpires?: string;
  lifetimeWarranty?: boolean;
  warrantyDetails?: string;
  syncChildEntityLocations?: boolean;
  [key: string]: unknown;
}

export interface EntityListResult {
  items?: EntitySummary[];
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
}
