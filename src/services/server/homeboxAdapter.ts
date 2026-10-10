import {
  CreateItemRequest,
  Item,
  Label,
  Location,
  UpdateItemRequest,
} from '../../types';
import {TreeNode} from './types';

/**
 * Homebox v1 routes. Homebox 0.26 unified items and locations as entities
 * and labels as tags; keeping the route contract in one module prevents the
 * upstream vocabulary from leaking into the rest of the app.
 */
export const HOMEBOX_ENDPOINTS = {
  status: '/api/v1/status',
  login: '/api/v1/users/login',
  logout: '/api/v1/users/logout',
  entities: '/api/v1/entities',
  entity: (id: string) => `/api/v1/entities/${encodeURIComponent(id)}`,
  entityAttachments: (id: string) =>
    `/api/v1/entities/${encodeURIComponent(id)}/attachments`,
  entityAttachment: (entityId: string, attachmentId: string) =>
    `/api/v1/entities/${encodeURIComponent(
      entityId,
    )}/attachments/${encodeURIComponent(attachmentId)}`,
  entityTree: '/api/v1/entities/tree',
  tags: '/api/v1/tags',
} as const;

export interface HomeboxEntityTypeSummary {
  id: string;
  name?: string;
  isLocation?: boolean;
}

export interface HomeboxTag {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
}

export interface HomeboxEntityField {
  id?: string;
  type?: string;
  name?: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
}

export interface HomeboxAttachment {
  id: string;
  type?: string;
  primary?: boolean;
  title?: string;
}

export interface HomeboxEntitySummary {
  id: string;
  assetId?: string;
  name: string;
  description?: string;
  quantity?: number;
  insured?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  purchasePrice?: number;
  parent?: HomeboxEntitySummary | null;
  entityType?: HomeboxEntityTypeSummary | null;
  tags?: HomeboxTag[];
  imageId?: string | null;
  thumbnailId?: string | null;
  itemCount?: number;
  soldDate?: string;
}

export interface HomeboxEntity extends HomeboxEntitySummary {
  location?: HomeboxEntitySummary | null;
  locationId?: string | null;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  lifetimeWarranty?: boolean;
  warrantyExpires?: string;
  warrantyDetails?: string;
  purchaseDate?: string;
  purchaseFrom?: string;
  soldTo?: string;
  soldPrice?: number;
  soldNotes?: string;
  notes?: string;
  syncChildEntityLocations?: boolean;
  attachments?: HomeboxAttachment[];
  fields?: HomeboxEntityField[];
}

export interface HomeboxEntityListResponse {
  items: HomeboxEntitySummary[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface HomeboxTreeItem {
  id: string;
  name: string;
  type?: string;
  children?: HomeboxTreeItem[];
}

export interface HomeboxEntityCreatePayload {
  name: string;
  description: string;
  quantity: number;
  parentId: string | null;
  tagIds: string[];
}

export interface HomeboxEntityUpdatePayload {
  id: string;
  name: string;
  description: string;
  quantity: number;
  parentId: string | null;
  locationId?: string | null;
  tagIds: string[];
  assetId?: string;
  archived: boolean;
  insured: boolean;
  purchasePrice: number;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  notes: string;
  purchaseDate: string;
  purchaseFrom: string;
  soldDate: string;
  soldPrice: number;
  soldTo: string;
  soldNotes: string;
  lifetimeWarranty: boolean;
  warrantyExpires: string;
  warrantyDetails: string;
  syncChildEntityLocations: boolean;
  fields: HomeboxEntityField[];
  entityTypeId?: string;
}

const toNumber = (value: number | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const toStringValue = (value: string | undefined): string => value ?? '';

export const isHomeboxLocation = (
  entity: HomeboxEntitySummary | null | undefined,
): boolean => entity?.entityType?.isLocation === true;

export const mapHomeboxTag = (tag: HomeboxTag): Label => ({
  id: tag.id,
  name: tag.name,
  description: tag.description,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

export const mapHomeboxLocation = (entity: HomeboxEntitySummary): Location => ({
  id: entity.id,
  name: entity.name,
  description: toStringValue(entity.description),
  itemCount: toNumber(entity.itemCount),
  imageId: entity.thumbnailId ?? entity.imageId ?? null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

const getNearestLocation = (
  entity: HomeboxEntity | HomeboxEntitySummary,
): Location | null => {
  if (
    'location' in entity &&
    entity.location &&
    isHomeboxLocation(entity.location)
  ) {
    return mapHomeboxLocation(entity.location);
  }

  if (entity.parent && isHomeboxLocation(entity.parent)) {
    return mapHomeboxLocation(entity.parent);
  }

  return null;
};

const getPrimaryImageId = (
  entity: HomeboxEntity | HomeboxEntitySummary,
): string | null => {
  const attachmentImage =
    'attachments' in entity
      ? entity.attachments?.find(
          attachment => attachment.primary && attachment.type === 'photo',
        )?.id
      : undefined;

  return entity.thumbnailId ?? entity.imageId ?? attachmentImage ?? null;
};

export const mapHomeboxEntity = (entity: HomeboxEntity): Item => ({
  id: entity.id,
  name: entity.name,
  description: toStringValue(entity.description),
  quantity: toNumber(entity.quantity),
  location: getNearestLocation(entity),
  labels: (entity.tags ?? []).map(mapHomeboxTag),
  archived: entity.archived === true,
  assetId: toStringValue(entity.assetId),
  createdAt: toStringValue(entity.createdAt),
  updatedAt: toStringValue(entity.updatedAt),
  imageId: getPrimaryImageId(entity),
  insured: entity.insured === true,
  purchasePrice: toNumber(entity.purchasePrice),
  // Homebox represents the user-editable numeric asset identifier as the
  // closest equivalent to the app's legacy barcode field.
  barcode: entity.assetId ?? null,
});

export const mapHomeboxSummary = (entity: HomeboxEntitySummary): Item =>
  mapHomeboxEntity(entity as HomeboxEntity);

export const mapHomeboxTree = (node: HomeboxTreeItem): TreeNode => ({
  id: node.id,
  name: node.name,
  type: node.type,
  children: (node.children ?? []).map(mapHomeboxTree),
});

const normalizeAssetId = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  if (!normalized || !/^[0-9]{1,18}(?:-[0-9]{1,18})?$/.test(normalized)) {
    return undefined;
  }

  return normalized;
};

export const toHomeboxEntityCreate = (
  item: CreateItemRequest,
): HomeboxEntityCreatePayload => ({
  name: item.name.trim(),
  description: item.description ?? '',
  quantity: Math.max(0, Number(item.quantity) || 0),
  parentId: item.locationId ?? null,
  tagIds: item.labels ?? [],
});

export const toHomeboxEntityUpdate = (
  item: UpdateItemRequest,
  current: HomeboxEntity,
): HomeboxEntityUpdatePayload => {
  const assetId =
    normalizeAssetId(item.barcode) ??
    normalizeAssetId(item.assetId) ??
    normalizeAssetId(current.assetId);

  // Editing an item inside a container must retain that parent when its
  // resolved location has not changed. Preserve explicit location overrides.
  const keepParent =
    item.locationId === undefined ||
    item.locationId === getNearestLocation(current)?.id;

  return {
    id: item.id,
    name: item.name.trim(),
    description: item.description ?? current.description ?? '',
    quantity: Math.max(0, Number(item.quantity) || 0),
    parentId: keepParent ? current.parent?.id ?? null : item.locationId ?? null,
    ...(keepParent && current.locationId !== undefined
      ? {locationId: current.locationId}
      : {}),
    tagIds: item.labels ?? (current.tags ?? []).map(tag => tag.id),
    ...(assetId ? {assetId} : {}),
    archived: current.archived === true,
    insured: item.insured ?? current.insured === true,
    purchasePrice:
      item.purchasePrice === undefined
        ? toNumber(current.purchasePrice)
        : Math.max(0, Number(item.purchasePrice) || 0),
    manufacturer: current.manufacturer ?? '',
    modelNumber: current.modelNumber ?? '',
    serialNumber: current.serialNumber ?? '',
    notes: current.notes ?? '',
    purchaseDate: current.purchaseDate ?? '',
    purchaseFrom: current.purchaseFrom ?? '',
    soldDate: current.soldDate ?? '',
    soldPrice: toNumber(current.soldPrice),
    soldTo: current.soldTo ?? '',
    soldNotes: current.soldNotes ?? '',
    lifetimeWarranty: current.lifetimeWarranty === true,
    warrantyExpires: current.warrantyExpires ?? '',
    warrantyDetails: current.warrantyDetails ?? '',
    syncChildEntityLocations: current.syncChildEntityLocations === true,
    fields: current.fields ?? [],
    ...(current.entityType?.id ? {entityTypeId: current.entityType.id} : {}),
  };
};
