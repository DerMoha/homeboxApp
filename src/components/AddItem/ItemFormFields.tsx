import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { EnabledFields } from '../../hooks/useItemData';

interface ItemFormFieldsProps {
  formData: Record<string, any>;
  enabledFields: EnabledFields;
  isQuantityFocused: boolean;
  onUpdateField: (field: string, value: any) => void;
  onQuantityFocus: () => void;
  onQuantityBlur: () => void;
}

export const ItemFormFields: React.FC<ItemFormFieldsProps> = ({
  formData,
  enabledFields,
  isQuantityFocused,
  onUpdateField,
  onQuantityFocus,
  onQuantityBlur,
}) => {
  const { theme } = useTheme();

  return (
    <>
      {/* Item Name */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Item Name *
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.colors.background.secondary,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border,
          }]}
          placeholder="Enter item name"
          placeholderTextColor={theme.colors.text.secondary}
          value={formData.name || ''}
          onChangeText={(text) => onUpdateField('name', text)}
        />
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Quantity
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.colors.background.secondary,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border,
          }]}
          placeholder="1"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="number-pad"
          value={isQuantityFocused ? formData.quantity : (formData.quantity || '1')}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            onUpdateField('quantity', numericValue);
          }}
          onFocus={onQuantityFocus}
          onBlur={onQuantityBlur}
        />
      </View>

      {/* Description (if enabled) */}
      {enabledFields.description && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: theme.colors.background.secondary,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            }]}
            placeholder="Enter description"
            placeholderTextColor={theme.colors.text.secondary}
            value={formData.description || ''}
            onChangeText={(text) => onUpdateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Purchase Price (if enabled) */}
      {enabledFields.purchasePrice && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Purchase Price (Optional)
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.background.secondary,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            }]}
            placeholder="0.00"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="decimal-pad"
            value={formData.purchasePrice || ''}
            onChangeText={(text) => onUpdateField('purchasePrice', text)}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 100,
  },
});
