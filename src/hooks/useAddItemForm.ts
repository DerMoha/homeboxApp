import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import ServerService from '../services/serverService';
import {Location, Label, EnabledFields, FormDataFile} from '../types';
import {logger} from '../utils/logger';

interface FormData {
  quantity: string;
  name?: string;
  description?: string;
  purchasePrice?: string;
  insured?: boolean;
  barcode?: string;
  [key: string]: any;
}

export const useAddItemForm = () => {
  const [formData, setFormData] = useState<FormData>({quantity: '1'});
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);

  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  }, []);

  const handleLabelToggle = useCallback((label: Label) => {
    setSelectedLabels(prev => {
      const exists = prev.find(l => l.id === label.id);
      if (exists) {
        return prev.filter(l => l.id !== label.id);
      } else {
        return [...prev, label];
      }
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({quantity: '1'});
    setSelectedLocation(null);
    setSelectedLabels([]);
  }, []);

  const submitItem = useCallback(
    async (
      imageUri: string | null,
      enabledFields: EnabledFields,
      onSuccess: () => void,
    ): Promise<boolean> => {
      if (!formData.name?.trim()) {
        Alert.alert('Error', 'Please enter an item name');
        return false;
      }

      if (!selectedLocation) {
        Alert.alert('Error', 'Please select a location');
        return false;
      }

      try {
        setIsLoading(true);
        const service = ServerService.getInstance();

        const itemData = {
          name: formData.name,
          quantity: parseInt(formData.quantity || '1', 10),
          locationId: selectedLocation?.id,
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

        const itemResponse = await service.createItem(itemData);

        if (!itemResponse.success || !itemResponse.data) {
          throw new Error('Failed to create item');
        }

        // Upload image if selected
        if (imageUri) {
          logger.log('Starting image upload for item', {
            itemId: itemResponse.data.id,
          });
          const imageFormData = new FormData();

          const fileExtension = imageUri.split('.').pop() || 'jpg';
          const fileName = `image.${fileExtension}`;

          const file: FormDataFile = {
            uri: imageUri,
            type: `image/${fileExtension}`,
            name: fileName,
          };

          logger.log('File object', {file});

          imageFormData.append('file', file as unknown as Blob);
          imageFormData.append('type', 'photo');
          imageFormData.append('primary', 'true');
          imageFormData.append('name', 'Item Image');

          logger.log('FormData prepared for image upload');

          const imageResponse = await service.uploadItemImage(
            itemResponse.data.id,
            imageFormData,
          );
          logger.log('Image upload response', {imageResponse});

          if (!imageResponse.success) {
            logger.warn('Failed to upload image', {
              error: imageResponse.error,
            });
            Alert.alert('Warning', 'Item was created but image upload failed');
          } else if (imageResponse.data) {
            logger.log('Image uploaded successfully, updated item', {
              item: imageResponse.data,
            });
          } else {
            logger.log('Image uploaded successfully without updated item data');
          }
        }

        Alert.alert('Success', 'Item added successfully!', [
          {text: 'OK', onPress: onSuccess},
        ]);

        return true;
      } catch (error) {
        logger.error('Error creating item:', {error});
        Alert.alert('Error', 'Failed to create item. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [formData, selectedLocation, selectedLabels],
  );

  return {
    formData,
    selectedLocation,
    selectedLabels,
    isLoading,
    isQuantityFocused,
    setIsQuantityFocused,
    setSelectedLocation,
    updateFormField,
    handleLabelToggle,
    resetForm,
    submitItem,
  };
};
