import {Item, Label, Location} from '../../../types';
import {EntitySummary, TagSummary} from '../types';

export const mapTagSummaryToLabel = (tag: TagSummary): Label => ({
  id: tag.id,
  name: tag.name,
  description: tag.description,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

export const mapEntitySummaryToLocation = (
  entity: EntitySummary,
): Location => ({
  id: entity.id,
  name: entity.name ?? '',
  description: entity.description ?? '',
  itemCount: entity.itemCount,
  imageId: entity.imageId ?? null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

const resolveItemLocation = (entity: EntitySummary): EntitySummary | null => {
  // Detail responses carry a resolved `location` edge (own or nearest
  // location ancestor); list summaries only have `parent`, which for items
  // directly inside a location is that location.
  if (entity.location) {
    return entity.location;
  }

  return entity.parent && entity.parent.entityType?.isLocation
    ? entity.parent
    : null;
};

export const mapEntityToItem = (entity: EntitySummary): Item => {
  const location = resolveItemLocation(entity);

  return {
    id: entity.id,
    name: entity.name ?? '',
    description: entity.description ?? '',
    quantity: entity.quantity ?? 0,
    location: location ? mapEntitySummaryToLocation(location) : null,
    labels: (entity.tags ?? []).map(mapTagSummaryToLabel),
    archived: entity.archived ?? false,
    assetId: entity.assetId ?? '',
    createdAt: entity.createdAt ?? '',
    updatedAt: entity.updatedAt ?? '',
    imageId: entity.imageId ?? null,
    insured: entity.insured ?? false,
    purchasePrice: entity.purchasePrice ?? 0,
    barcode: null,
  };
};

interface EntityUpdateOverrides {
  name?: string;
  description?: string;
  quantity?: number;
  parentId?: string;
  tagIds?: string[];
  purchasePrice?: number;
  insured?: boolean;
}

// The entities API PUT replaces every managed column, so the payload must
// carry through fields the app does not edit (assetId, notes, serial numbers,
// warranty and sale data) or they get zeroed on the server.
export const buildEntityUpdatePayload = (
  entity: EntitySummary,
  overrides: EntityUpdateOverrides,
) => ({
  id: entity.id,
  name: overrides.name ?? entity.name ?? '',
  description: overrides.description ?? entity.description ?? '',
  quantity: overrides.quantity ?? entity.quantity ?? 0,
  parentId:
    overrides.parentId ?? (entity.parent ? entity.parent.id : undefined),
  tagIds:
    overrides.tagIds ?? (entity.tags ?? []).map(tag => tag.id),
  purchasePrice: overrides.purchasePrice ?? entity.purchasePrice ?? 0,
  insured: overrides.insured ?? entity.insured ?? false,
  assetId: entity.assetId ?? '0',
  archived: entity.archived ?? false,
  notes: entity.notes ?? '',
  serialNumber: entity.serialNumber ?? '',
  modelNumber: entity.modelNumber ?? '',
  manufacturer: entity.manufacturer ?? '',
  purchaseDate: entity.purchaseDate,
  purchaseFrom: entity.purchaseFrom ?? '',
  soldDate: entity.soldDate,
  soldTo: entity.soldTo ?? '',
  soldPrice: entity.soldPrice ?? 0,
  soldNotes: entity.soldNotes ?? '',
  warrantyExpires: entity.warrantyExpires,
  lifetimeWarranty: entity.lifetimeWarranty ?? false,
  warrantyDetails: entity.warrantyDetails ?? '',
  syncChildEntityLocations: entity.syncChildEntityLocations ?? false,
});
