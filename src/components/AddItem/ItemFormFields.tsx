import React, {useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import type {EnabledFields} from '../../types';

interface ItemFormFieldsProps {
  formData: Record<string, string | number>;
  enabledFields: EnabledFields;
  isQuantityFocused: boolean;
  barcode?: string | null;
  onUpdateField: (field: string, value: string | number) => void;
  onQuantityFocus: () => void;
  onQuantityBlur: () => void;
  onScanBarcode?: () => void;
}

interface FieldTagProps {
  label: string;
  theme: ReturnType<typeof useTheme>['theme'];
}

const FieldTag: React.FC<FieldTagProps> = ({label, theme}) => {
  const fieldTagStyle = useMemo(
    () => [
      styles.fieldTag,
      {
        backgroundColor: theme.colors.accent.muted,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [
      theme.borderRadius.full,
      theme.colors.accent.muted,
      theme.colors.borderSubtle,
    ],
  );

  const fieldTagTextStyle = useMemo(
    () => ({
      color: theme.colors.accent.primary,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      fontFamily: theme.typography.fonts.semibold,
    }),
    [
      theme.colors.accent.primary,
      theme.typography.fonts.semibold,
      theme.typography.sizes.xs,
      theme.typography.weights.semibold,
    ],
  );

  return (
    <View style={fieldTagStyle}>
      <Text style={fieldTagTextStyle}>{label}</Text>
    </View>
  );
};

export const ItemFormFields: React.FC<ItemFormFieldsProps> = ({
  formData,
  enabledFields,
  isQuantityFocused,
  barcode,
  onUpdateField,
  onQuantityFocus,
  onQuantityBlur,
  onScanBarcode,
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
      fontFamily: theme.typography.fonts.regular,
    },
  ];

  const labelStyle = [
    styles.fieldLabel,
    {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      letterSpacing: theme.typography.letterSpacing.normal,
      fontFamily: theme.typography.fonts.medium,
    },
  ];

  const sectionSpacingStyle = useMemo(
    () => ({marginBottom: theme.spacing.md}),
    [theme.spacing.md],
  );

  const scanButtonStyle = useMemo(
    () => [
      styles.scanButton,
      {
        backgroundColor: theme.colors.accent.muted,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme.colors.accent.muted, theme.borderRadius.md],
  );

  return (
    <>
      {/* Item Name */}
      <View style={sectionSpacingStyle}>
        <View style={styles.labelRow}>
          <Text style={labelStyle}>Item name</Text>
          <FieldTag label="Required" theme={theme} />
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
      <View style={sectionSpacingStyle}>
        <View style={styles.labelRow}>
          <Text style={labelStyle}>Quantity</Text>
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

      {/* Barcode */}
      <View style={sectionSpacingStyle}>
        <View style={styles.labelRow}>
          <Text style={labelStyle}>Barcode</Text>
          <FieldTag label="Optional" theme={theme} />
        </View>
        <View style={styles.barcodeRow}>
          <TextInput
            style={[inputStyle, styles.barcodeInput]}
            placeholder="Scan or enter barcode"
            placeholderTextColor={theme.colors.text.secondary}
            value={String(barcode || '')}
            onChangeText={text => onUpdateField('barcode', text)}
          />
          {onScanBarcode && (
            <TouchableOpacity style={scanButtonStyle} onPress={onScanBarcode}>
              <MaterialIcons
                name="qr-code-scanner"
                size={20}
                color={theme.colors.accent.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description (if enabled) */}
      {enabledFields.description && (
        <View style={sectionSpacingStyle}>
          <View style={styles.labelRow}>
            <Text style={labelStyle}>Description</Text>
            <FieldTag label="Optional" theme={theme} />
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
            <Text style={labelStyle}>Purchase price</Text>
            <FieldTag label="Optional" theme={theme} />
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
    marginBottom: 6,
  },
  fieldLabel: {
    textTransform: 'none',
  },
  fieldTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: {
    minHeight: 120,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
