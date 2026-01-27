import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';
import {EnabledFields} from '../../hooks/useItemData';

interface ItemFormFieldsProps {
  formData: Record<string, string | number>;
  enabledFields: EnabledFields;
  isQuantityFocused: boolean;
  onUpdateField: (field: string, value: string | number) => void;
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
  const {theme} = useTheme();

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.background.secondary,
      color: theme.colors.text.primary,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.sizes.md,
    },
  ];

  const labelStyle = [
    styles.fieldLabel,
    {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.xs,
      letterSpacing: theme.typography.letterSpacing.wide,
    },
  ];

  const FieldTag: React.FC<{label: string}> = ({label}) => (
    <View
      style={[
        styles.fieldTag,
        {
          backgroundColor: theme.colors.accent.muted,
          borderRadius: theme.borderRadius.full,
        },
      ]}>
      <Text
        style={{
          color: theme.colors.accent.primary,
          fontSize: theme.typography.sizes.xs,
          fontWeight: theme.typography.weights.medium,
        }}>
        {label}
      </Text>
    </View>
  );

  return (
    <>
      {/* Item Name */}
      <View style={{marginBottom: theme.spacing.md}}>
        <View style={styles.labelRow}>
          <Text style={labelStyle}>ITEM NAME</Text>
          <FieldTag label="Required" />
        </View>
        <TextInput
          style={inputStyle}
          placeholder="Enter item name"
          placeholderTextColor={theme.colors.text.secondary}
          value={String(formData.name || '')}
          onChangeText={text => onUpdateField('name', text)}
        />
      </View>

      {/* Quantity */}
      <View style={{marginBottom: theme.spacing.md}}>
        <View style={styles.labelRow}>
          <Text style={labelStyle}>QUANTITY</Text>
        </View>
        <TextInput
          style={inputStyle}
          placeholder="1"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="number-pad"
          value={String(
            isQuantityFocused ? formData.quantity : formData.quantity || '1',
          )}
          onChangeText={text => {
            const numericValue = text.replace(/[^0-9]/g, '');
            onUpdateField('quantity', numericValue);
          }}
          onFocus={onQuantityFocus}
          onBlur={onQuantityBlur}
        />
      </View>

      {/* Description (if enabled) */}
      {enabledFields.description && (
        <View style={{marginBottom: theme.spacing.md}}>
          <View style={styles.labelRow}>
            <Text style={labelStyle}>DESCRIPTION</Text>
            <FieldTag label="Optional" />
          </View>
          <TextInput
            style={[inputStyle, styles.textArea]}
            placeholder="Enter description"
            placeholderTextColor={theme.colors.text.secondary}
            value={String(formData.description || '')}
            onChangeText={text => onUpdateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Purchase Price (if enabled) */}
      {enabledFields.purchasePrice && (
        <View>
          <View style={styles.labelRow}>
            <Text style={labelStyle}>PURCHASE PRICE</Text>
            <FieldTag label="Optional" />
          </View>
          <TextInput
            style={inputStyle}
            placeholder="0.00"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="decimal-pad"
            value={String(formData.purchasePrice || '')}
            onChangeText={text => onUpdateField('purchasePrice', text)}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    textTransform: 'uppercase',
  },
  fieldTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
  },
});
