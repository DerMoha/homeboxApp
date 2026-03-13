import {useCallback} from 'react';
import {Alert} from 'react-native';
import {EnabledFields, Item} from '../types';
import {useItemFormState} from './useItemFormState';
import {useSaveItem} from './useSaveItem';

export const useAddItemForm = () => {
  const formState = useItemFormState();
  const {isLoading, saveItem} = useSaveItem();

  const submitItem = useCallback(
    async (
      itemId: string | undefined,
      imageUri: string | null,
      enabledFields: EnabledFields,
      onSuccess: (item: Item) => void,
    ): Promise<boolean> => {
      const result = await saveItem({
        itemId,
        imageUri,
        enabledFields,
        formData: formState.formData,
        selectedLocation: formState.selectedLocation,
        selectedLabels: formState.selectedLabels,
      });

      if (result.validationError) {
        Alert.alert('Error', result.validationError);
        return false;
      }

      if (!result.success || !result.item) {
        Alert.alert(
          'Error',
          result.error ||
            (itemId
              ? 'Failed to update item. Please try again.'
              : 'Failed to create item. Please try again.'),
        );
        return false;
      }

      if (result.warning) {
        Alert.alert('Warning', result.warning);
      }

      Alert.alert(
        'Success',
        itemId ? 'Item updated successfully!' : 'Item added successfully!',
        [{text: 'OK', onPress: () => onSuccess(result.item as Item)}],
      );

      return true;
    },
    [formState, saveItem],
  );

  return {
    formData: formState.formData,
    selectedLocation: formState.selectedLocation,
    selectedLabels: formState.selectedLabels,
    isLoading,
    isQuantityFocused: formState.isQuantityFocused,
    setIsQuantityFocused: formState.setIsQuantityFocused,
    setSelectedLocation: formState.setSelectedLocation,
    updateFormField: formState.updateFormField,
    handleLabelToggle: formState.handleLabelToggle,
    resetForm: formState.resetForm,
    populateForm: formState.populateForm,
    submitItem,
  };
};
