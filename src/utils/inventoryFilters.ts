import {Item, FilterState} from '../types';

/**
 * Check if an item matches the search query
 * Searches across name, description, assetId, location name, and label names
 */
export const matchesSearch = (item: Item, query: string): boolean => {
  if (!query || query.trim() === '') {
    return true;
  }

  const searchTerm = query.toLowerCase().trim();

  // Search in item name
  if (item.name.toLowerCase().includes(searchTerm)) {
    return true;
  }

  // Search in description
  if (item.description?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  // Search in asset ID
  if (item.assetId?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  // Search in location name
  if (item.location?.name?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  // Search in label names
  if (
    item.labels?.some(label => label.name?.toLowerCase().includes(searchTerm))
  ) {
    return true;
  }

  return false;
};

/**
 * Apply all filter criteria to items list
 * Uses AND logic - items must match all active filters
 */
export const applyFilters = (items: Item[], filters: FilterState): Item[] => {
  return items.filter(item => {
    // Location filter
    if (filters.locationId !== null) {
      if (item.location?.id !== filters.locationId) {
        return false;
      }
    }

    // Labels filter (item must have ALL selected labels)
    if (filters.labelIds.length > 0) {
      const itemLabelIds = item.labels?.map(label => label.id) || [];
      const hasAllLabels = filters.labelIds.every(labelId =>
        itemLabelIds.includes(labelId),
      );
      if (!hasAllLabels) {
        return false;
      }
    }

    // Insurance filter
    if (filters.insuranceStatus !== 'all') {
      const isInsured = item.insured === true;
      if (filters.insuranceStatus === 'insured' && !isInsured) {
        return false;
      }
      if (filters.insuranceStatus === 'uninsured' && isInsured) {
        return false;
      }
    }

    // Quantity range filter
    if (filters.quantityMin !== null && item.quantity < filters.quantityMin) {
      return false;
    }
    if (filters.quantityMax !== null && item.quantity > filters.quantityMax) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const itemDate = new Date(item.createdAt);
      const now = new Date();
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (filters.dateRange) {
        case 'week':
          if (diffDays > 7) {
            return false;
          }
          break;
        case 'month':
          if (diffDays > 30) {
            return false;
          }
          break;
        case 'quarter':
          if (diffDays > 90) {
            return false;
          }
          break;
      }
    }

    return true;
  });
};

/**
 * Calculate the number of active filters for badge display
 */
export const getActiveFilterCount = (filters: FilterState): number => {
  let count = 0;

  if (filters.locationId !== null) {
    count++;
  }
  if (filters.labelIds.length > 0) {
    count++;
  }
  if (filters.insuranceStatus !== 'all') {
    count++;
  }
  if (filters.quantityMin !== null || filters.quantityMax !== null) {
    count++;
  }
  if (filters.dateRange !== 'all') {
    count++;
  }

  return count;
};
