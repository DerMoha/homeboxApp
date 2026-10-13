import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Item} from '../types';
import ServerService from '../services/serverService';

export const useEditableItemLoader = (
  itemId: string | undefined,
  onItemLoaded: (item: Item) => void,
  onMissingItem: () => void,
) => {
  const [preparedItemId, setPreparedItemId] = useState<string | undefined>();
  const [isPreparingItem, setIsPreparingItem] = useState(Boolean(itemId));

  useFocusEffect(
    useCallback(() => {
      if (!itemId) {
        return;
      }

      let isMounted = true;
      setPreparedItemId(undefined);

      const loadItem = async () => {
        try {
          setIsPreparingItem(true);
          const result = await ServerService.getInstance().getItemById(itemId);

          if (!isMounted) {
            return;
          }

          if (result.success && result.data) {
            onItemLoaded(result.data);
            setPreparedItemId(itemId);
            return;
          }

          onMissingItem();
        } finally {
          if (isMounted) {
            setIsPreparingItem(false);
          }
        }
      };

      loadItem();

      return () => {
        isMounted = false;
      };
    }, [itemId, onItemLoaded, onMissingItem]),
  );

  return {isPreparingItem, preparedItemId};
};
