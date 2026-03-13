import {useEffect, useState} from 'react';
import {Item} from '../types';
import ServerService from '../services/serverService';

export const useEditableItemLoader = (
  itemId: string | undefined,
  onItemLoaded: (item: Item) => void,
  onMissingItem: () => void,
) => {
  const [isPreparingItem, setIsPreparingItem] = useState(false);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let isMounted = true;

    const loadItem = async () => {
      try {
        setIsPreparingItem(true);
        const result = await ServerService.getInstance().getItemById(itemId);

        if (!isMounted) {
          return;
        }

        if (result.success && result.data) {
          onItemLoaded(result.data);
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
  }, [itemId, onItemLoaded, onMissingItem]);

  return {isPreparingItem};
};
