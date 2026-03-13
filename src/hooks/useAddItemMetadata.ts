import {useCallback} from 'react';
import {useItemData} from './useItemData';

export const useAddItemMetadata = (loadImageQuality: () => Promise<void>) => {
  const itemData = useItemData();

  const loadMetadata = useCallback(async () => {
    await Promise.all([
      itemData.loadEnabledFields(),
      loadImageQuality(),
      itemData.loadLocations(),
      itemData.loadLabels(),
    ]);
  }, [itemData, loadImageQuality]);

  return {
    ...itemData,
    loadMetadata,
  };
};
