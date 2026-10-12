import {useCallback, useState} from 'react';
import ServerService from '../services/serverService';
import {EnabledFields, Item, Label, Location} from '../types';
import {logger} from '../utils/logger';
import {saveRecoveryService} from '../services/saveRecoveryService';
import {ItemFormData} from './useItemFormState';

interface SaveItemParams {
  itemId?: string;
  imageUri: string | null;
  enabledFields: EnabledFields;
  formData: ItemFormData;
  selectedLocation: Location | null;
  selectedLabels: Label[];
}

interface SaveItemResult {
  success: boolean;
  item?: Item;
  error?: string;
  warning?: string;
  validationError?: string;
}

export const useSaveItem = () => {
  const [isLoading, setIsLoading] = useState(false);

  const saveItem = useCallback(
    async ({
      itemId,
      imageUri,
      enabledFields,
      formData,
      selectedLocation,
      selectedLabels,
    }: SaveItemParams): Promise<SaveItemResult> => {
      if (!formData.name?.trim()) {
        return {success: false, validationError: 'Please enter an item name'};
      }

      if (!selectedLocation) {
        return {success: false, validationError: 'Please select a location'};
      }

      const assetId = (formData.barcode || formData.assetId || '').trim();
      if (assetId && !/^[0-9]{1,18}(?:-[0-9]{1,18})?$/.test(assetId)) {
        return {
          success: false,
          validationError:
            'Homebox asset IDs must be numeric, optionally with a hyphen. Clear this field to use an automatically assigned ID.',
        };
      }
      if (
        (formData.name?.trim().length || 0) > 255 ||
        (enabledFields.description &&
          (formData.description?.length || 0) > 1000)
      ) {
        return {
          success: false,
          validationError:
            'Use at most 255 characters for the name and 1000 for the description.',
        };
      }

      try {
        setIsLoading(true);
        const service = ServerService.getInstance();

        const itemData = {
          name: formData.name,
          quantity: parseInt(formData.quantity || '1', 10),
          locationId: selectedLocation.id,
          ...(enabledFields.description
            ? {description: formData.description || ''}
            : {}),
          ...(enabledFields.purchasePrice
            ? {purchasePrice: parseFloat(formData.purchasePrice || '0') || 0}
            : {}),
          ...(enabledFields.insured
            ? {insured: formData.insured || false}
            : {}),
          assetId:
            typeof formData.assetId === 'string' && formData.assetId.trim()
              ? formData.assetId.trim()
              : formData.barcode?.trim() || undefined,
          barcode: formData.barcode?.trim() || undefined,
          labels: selectedLabels.map(label => label.id),
        };

        const itemResponse = await saveRecoveryService.begin(
          service,
          itemData,
          imageUri,
          itemId,
        );
        if (!itemResponse.success || !itemResponse.data) {
          return {
            success: false,
            error:
              itemResponse.error ||
              'Save could not complete. Check Pending saves in Settings.',
          };
        }
        return {
          success: true,
          item: itemResponse.data,
          warning: itemResponse.warning,
        };
      } catch (error) {
        logger.error('Error saving item', {error, itemId});
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Save could not complete. Check Pending saves in Settings.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {isLoading, saveItem};
};
