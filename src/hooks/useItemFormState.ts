import {useCallback, useState} from 'react';
import {Label, Location, Item} from '../types';

export interface ItemFormData {
  quantity: string;
  name?: string;
  description?: string;
  purchasePrice?: string;
  insured?: boolean;
  barcode?: string;
  [key: string]: string | number | boolean | undefined;
}

type ItemFormValue = string | number | boolean | undefined;

export const useItemFormState = () => {
  const [formData, setFormData] = useState<ItemFormData>({quantity: '1'});
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);

  const updateFormField = useCallback((field: string, value: ItemFormValue) => {
    setFormData(prev => ({...prev, [field]: value}));
  }, []);

  const handleLabelToggle = useCallback((label: Label) => {
    setSelectedLabels(prev => {
      const exists = prev.find(currentLabel => currentLabel.id === label.id);
      return exists
        ? prev.filter(currentLabel => currentLabel.id !== label.id)
        : [...prev, label];
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({quantity: '1'});
    setSelectedLocation(null);
    setSelectedLabels([]);
    setIsQuantityFocused(false);
  }, []);

  const populateForm = useCallback((item: Item) => {
    setFormData({
      name: item.name,
      quantity: String(item.quantity || 1),
      description: item.description || '',
      purchasePrice:
        item.purchasePrice > 0 ? String(item.purchasePrice) : undefined,
      insured: item.insured,
      barcode: item.barcode || '',
    });
    setSelectedLocation(item.location);
    setSelectedLabels(item.labels || []);
  }, []);

  return {
    formData,
    selectedLocation,
    selectedLabels,
    isQuantityFocused,
    setSelectedLocation,
    setIsQuantityFocused,
    updateFormField,
    handleLabelToggle,
    resetForm,
    populateForm,
  };
};
