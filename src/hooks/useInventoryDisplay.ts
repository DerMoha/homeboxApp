import {useState, useCallback, useEffect} from 'react';
import {storageService, STORAGE_KEYS} from '../services/storageService';
import {logger} from '../utils/logger';

type ViewMode = 'list' | 'grid';

export const useInventoryDisplay = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [itemsPerRow, setItemsPerRow] = useState(2);
  const [listZoom, setListZoom] = useState(1);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [gridConfigVisible, setGridConfigVisible] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedViewMode = await storageService.getItem<ViewMode>(
          STORAGE_KEYS.INVENTORY_VIEW_MODE,
          'list',
        );
        const savedItemsPerRow = await storageService.getItem<number>(
          STORAGE_KEYS.INVENTORY_ITEMS_PER_ROW,
          2,
        );
        const savedListZoom = await storageService.getItem<number>(
          STORAGE_KEYS.INVENTORY_LIST_ZOOM,
          1,
        );

        if (savedViewMode) {
          setViewMode(savedViewMode);
        }
        if (savedItemsPerRow) {
          setItemsPerRow(savedItemsPerRow);
        }
        if (savedListZoom) {
          setListZoom(savedListZoom);
        }
      } catch (error) {
        logger.error('Error loading display settings:', error);
      }
    };

    loadSettings();
  }, []);

  const saveViewMode = useCallback(async (mode: ViewMode) => {
    setViewMode(mode);
    await storageService.setItem(STORAGE_KEYS.INVENTORY_VIEW_MODE, mode);
  }, []);

  const saveItemsPerRow = useCallback(async (count: number) => {
    setItemsPerRow(count);
    await storageService.setItem(STORAGE_KEYS.INVENTORY_ITEMS_PER_ROW, count);
  }, []);

  const saveListZoom = useCallback(async (zoom: number) => {
    setListZoom(zoom);
    await storageService.setItem(STORAGE_KEYS.INVENTORY_LIST_ZOOM, zoom);
  }, []);

  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    saveViewMode(newMode);
  }, [viewMode, saveViewMode]);

  const increaseItemsPerRow = useCallback(() => {
    if (itemsPerRow < 5) {
      saveItemsPerRow(itemsPerRow + 1);
    }
  }, [itemsPerRow, saveItemsPerRow]);

  const decreaseItemsPerRow = useCallback(() => {
    if (itemsPerRow > 1) {
      saveItemsPerRow(itemsPerRow - 1);
    }
  }, [itemsPerRow, saveItemsPerRow]);

  const increaseListZoom = useCallback(() => {
    if (listZoom < 2) {
      saveListZoom(listZoom + 1);
    }
  }, [listZoom, saveListZoom]);

  const decreaseListZoom = useCallback(() => {
    if (listZoom > 0) {
      saveListZoom(listZoom - 1);
    }
  }, [listZoom, saveListZoom]);

  return {
    viewMode,
    itemsPerRow,
    listZoom,
    sortModalVisible,
    gridConfigVisible,
    setSortModalVisible,
    setGridConfigVisible,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
  };
};
