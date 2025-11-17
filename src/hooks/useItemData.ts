import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import ServerService from '../services/serverService';
import { logger } from '../utils/logger';

export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface Label {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnabledFields {
  description: boolean;
  purchasePrice: boolean;
  insured: boolean;
  labels: boolean;
}

export const useItemData = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [enabledFields, setEnabledFields] = useState<EnabledFields>({
    description: true,
    purchasePrice: false,
    insured: false,
    labels: true,
  });
  const [isConnecting, setIsConnecting] = useState(true);

  const loadEnabledFields = useCallback(async () => {
    try {
      const savedFields = await AsyncStorage.getItem('@add_item_fields');
      if (savedFields) {
        const fields = JSON.parse(savedFields);
        const enabledMap = fields.reduce((acc: Record<string, boolean>, field: any) => {
          acc[field.id] = field.enabled;
          return acc;
        }, {});
        setEnabledFields(prev => ({ ...prev, ...enabledMap }));
      }
    } catch (error) {
      logger.error('Error loading enabled fields:', error);
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
      logger.error('Error loading locations:', error);
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
      logger.error('Error loading labels:', error);
      Alert.alert('Error', 'Failed to load labels');
    }
  }, []);

  const autoConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const service = ServerService.getInstance();
      const response = await service.autoConnect();

      if (!response.success) {
        Alert.alert('Error', 'Failed to connect to server. Please check your connection settings.');
        return false;
      }

      await Promise.all([loadLocations(), loadLabels()]);
      return true;
    } catch (error) {
      logger.error('Error auto-connecting:', error);
      Alert.alert('Error', 'Failed to connect to server');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [loadLocations, loadLabels]);

  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  return {
    locations,
    labels,
    enabledFields,
    isConnecting,
    loadEnabledFields,
    refreshData: useCallback(() => {
      loadLocations();
      loadLabels();
    }, [loadLocations, loadLabels]),
  };
};
