import {useCallback} from 'react';
import {useItemData} from './useItemData';

export const useAddItemMetadata = (loadImageQuality: () => Promise<void>) => {
  const itemData = useItemData();

  const {loadEnabledFields, loadLocations, loadLabels} = itemData;

  const loadMetadata = useCallback(async () => {
    await Promise.all([
      loadEnabledFields(),
      loadImageQuality(),
      loadLocations(),
      loadLabels(),
    ]);
  }, [loadEnabledFields, loadImageQuality, loadLocations, loadLabels]);

  return {
    ...itemData,
    loadMetadata,
  };
};
