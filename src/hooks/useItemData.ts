import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import ServerService from '../services/serverService';
import {logger} from '../utils/logger';
import {Location, Label, EnabledFields} from '../types';
import {storageService, STORAGE_KEYS} from '../services/storageService';

export const useItemData = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [enabledFields, setEnabledFields] = useState<EnabledFields>({
    description: true,
    purchasePrice: false,
    insured: false,
    labels: true,
  });

  const loadEnabledFields = useCallback(async () => {
    try {
      const savedFields = await storageService.getItem<
        Array<{id: string; enabled: boolean}>
      >(STORAGE_KEYS.ADD_ITEM_FIELDS);
      if (!savedFields) {
        return;
      }
      const enabledMap = savedFields.reduce((acc, field) => {
        acc[field.id] = field.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      setEnabledFields(prev => ({...prev, ...enabledMap}));
    } catch (error) {
      logger.error('Error loading enabled fields', {error});
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const service = ServerService.getInstance();
      const response = await service.getLocations();
      if (response.success && response.data) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      logger.error('Error loading locations', {error});
      Alert.alert('Error', 'Failed to load locations');
    }
  }, []);

  const loadLabels = useCallback(async () => {
    try {
      const service = ServerService.getInstance();
      const response = await service.getLabels();
      if (response.success && response.data) {
        setLabels(response.data);
      }
    } catch (error) {
      logger.error('Error loading labels', {error});
      Alert.alert('Error', 'Failed to load labels');
    }
  }, []);

  return {
    locations,
    labels,
    enabledFields,
    loadEnabledFields,
    loadLocations,
    loadLabels,
    refreshData: useCallback(() => {
      loadLocations();
      loadLabels();
    }, [loadLocations, loadLabels]),
  };
};
