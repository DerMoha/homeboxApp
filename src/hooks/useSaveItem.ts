import {useCallback, useState} from 'react';
import ServerService from '../services/serverService';
import {EnabledFields, FormDataFile, Item, Label, Location} from '../types';
import {logger} from '../utils/logger';
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

      try {
        setIsLoading(true);
        const service = ServerService.getInstance();

        const itemData = {
          name: formData.name,
          quantity: parseInt(formData.quantity || '1', 10),
          locationId: selectedLocation.id,
          description: enabledFields.description
            ? formData.description || ''
            : '',
          purchasePrice: enabledFields.purchasePrice
            ? parseFloat(formData.purchasePrice || '0') || 0
            : 0,
          insured: enabledFields.insured ? formData.insured || false : false,
          barcode: formData.barcode?.trim() || undefined,
          labels: selectedLabels.map(label => label.id),
        };

        const itemResponse = itemId
          ? await service.updateItem({...itemData, id: itemId})
          : await service.createItem(itemData);

        if (!itemResponse.success || !itemResponse.data) {
          return {
            success: false,
            error: itemId ? 'Failed to update item' : 'Failed to create item',
          };
        }

        let savedItem = itemResponse.data;
        let warning: string | undefined;

        if (imageUri) {
          logger.log('Starting image upload for item', {
            itemId: itemResponse.data.id,
          });

          const imageFormData = new FormData();
          const fileExtension = imageUri.split('.').pop() || 'jpg';
          const file: FormDataFile = {
            uri: imageUri,
            type: `image/${fileExtension}`,
            name: `image.${fileExtension}`,
          };

          imageFormData.append('file', file as unknown as Blob);
          imageFormData.append('type', 'photo');
          imageFormData.append('primary', 'true');
          imageFormData.append('name', 'Item Image');

          const imageResponse = await service.uploadItemImage(
            itemResponse.data.id,
            imageFormData,
          );

          if (!imageResponse.success) {
            warning = itemId
              ? 'Item was updated but image upload failed'
              : 'Item was created but image upload failed';
            logger.warn('Failed to upload image', {error: imageResponse.error});
          } else if (imageResponse.data) {
            savedItem = imageResponse.data;
          }
        }

        return {success: true, item: savedItem, warning};
      } catch (error) {
        logger.error('Error saving item', {error, itemId});
        return {
          success: false,
          error: itemId
            ? 'Failed to update item. Please try again.'
            : 'Failed to create item. Please try again.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {isLoading, saveItem};
};
