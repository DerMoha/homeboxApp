import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useItemData} from '../hooks/useItemData';
import {useImageHandler} from '../hooks/useImageHandler';
import {useAddItemForm} from '../hooks/useAddItemForm';
import {
  ImagePickerSection,
  LocationSelector,
  LabelSelector,
  ItemFormFields,
} from '../components/AddItem';
import {SectionHeader} from '../components/SectionHeader';
import {BarcodeScannerModal} from '../components/BarcodeScanner';
import {barcodeService} from '../services/barcodeService';
import {AddItemStackParamList} from '../types/navigation';

const AddItemScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AddItemStackParamList, 'AddItem'>
    >();
  const route = useRoute<RouteProp<AddItemStackParamList, 'AddItem'>>();

  const screenStyle = [
    styles.container,
    {backgroundColor: theme.colors.background.primary},
  ];

  const formCardStyle = [
    styles.formCard,
    {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.borderRadius.lg,
    },
    theme.shadows.sm,
  ];

  const contentStyle = useMemo(
    () => [styles.content, {paddingHorizontal: theme.spacing.md}],
    [theme.spacing.md],
  );

  const {
    locations,
    labels,
    enabledFields,
    loadEnabledFields,
    loadLocations,
    loadLabels,
  } = useItemData();

  const {
    selectedImage,
    imageRotation,
    imageFlip,
    originalSize,
    compressedSize,
    isPreviewVisible,
    setIsPreviewVisible,
    loadImageQuality,
    handleImagePicker,
    handleRotateImage,
    handleFlipImage,
    clearImage,
    formatFileSize,
  } = useImageHandler();

  const {
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
  } = useAddItemForm();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  const submitButtonStyle = useMemo(
    () => [
      styles.submitButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.lg,
        opacity: isLoading ? 0.6 : 1,
      },
      theme.shadows.sm,
    ],
    [
      isLoading,
      theme.borderRadius.lg,
      theme.colors.accent.primary,
      theme.shadows.sm,
    ],
  );

  const submitIconStyle = useMemo(
    () => [
      styles.submitIconContainer,
      {backgroundColor: theme.colors.accent.muted},
    ],
    [theme.colors.accent.muted],
  );

  const submitButtonTextStyle = useMemo(
    () => [
      styles.submitButtonText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.colors.text.inverse,
      theme.typography.fonts.semibold,
      theme.typography.sizes.md,
      theme.typography.weights.semibold,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        loadEnabledFields(),
        loadImageQuality(),
        loadLocations(),
        loadLabels(),
      ]);
    }, [loadEnabledFields, loadImageQuality, loadLabels, loadLocations]),
  );

  useEffect(() => {
    navigation.setOptions({
      title: 'Add Item',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
    });
  }, [navigation, theme]);

  const handleSubmit = async () => {
    const success = await submitItem(selectedImage, enabledFields, () => {
      resetForm();
      clearImage();
    });

    if (success) {
      navigation.goBack();
    }
  };

  const handleQuantityFocus = () => {
    setIsQuantityFocused(true);
    if (formData.quantity === '1') {
      updateFormField('quantity', '');
    }
  };

  const handleQuantityBlur = () => {
    setIsQuantityFocused(false);
    if (!formData.quantity) {
      updateFormField('quantity', '1');
    }
  };

  const applyBarcode = useCallback(
    async (scannedBarcode: string) => {
      const trimmedBarcode = scannedBarcode.trim();

      if (!trimmedBarcode) {
        return;
      }

      updateFormField('barcode', trimmedBarcode);
      setIsLookingUpBarcode(true);

      try {
        const result = await barcodeService.lookupBarcode(trimmedBarcode);
        if (result.success && result.product) {
          if (!formData.name?.trim() && result.product.name) {
            updateFormField('name', result.product.name);
          }
          if (!formData.description?.trim() && result.product.description) {
            updateFormField('description', result.product.description);
          }
        }
      } catch {
        // Silently fail - barcode is still saved
      } finally {
        setIsLookingUpBarcode(false);
      }
    },
    [formData.description, formData.name, updateFormField],
  );

  useEffect(() => {
    const routeBarcode = route.params?.barcode;

    if (!routeBarcode || routeBarcode === formData.barcode) {
      return;
    }

    applyBarcode(routeBarcode);
    navigation.setParams({barcode: undefined});
  }, [applyBarcode, formData.barcode, navigation, route.params?.barcode]);

  const handleBarcodeDetected = useCallback(
    (scannedBarcode: string) => {
      setScannerVisible(false);
      applyBarcode(scannedBarcode);
    },
    [applyBarcode],
  );

  const handleScanBarcode = useCallback(() => {
    setScannerVisible(true);
  }, []);

  return (
    <View style={screenStyle}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}>
        <SectionHeader title="Item Details" icon="info" variant="withIcon" />

        <View style={formCardStyle}>
          <ItemFormFields
            formData={formData}
            enabledFields={enabledFields}
            isQuantityFocused={isQuantityFocused}
            onUpdateField={updateFormField}
            onQuantityFocus={handleQuantityFocus}
            onQuantityBlur={handleQuantityBlur}
            onScanBarcode={handleScanBarcode}
          />
          {isLookingUpBarcode && (
            <View style={styles.lookupIndicator}>
              <ActivityIndicator
                size="small"
                color={theme.colors.accent.primary}
              />
              <Text
                style={[
                  styles.lookupText,
                  {color: theme.colors.text.secondary},
                ]}>
                Looking up product...
              </Text>
            </View>
          )}
        </View>

        <SectionHeader title="Location" icon="place" variant="withIcon" />

        <View style={formCardStyle}>
          <LocationSelector
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />
        </View>

        <SectionHeader title="Image" icon="photo-camera" variant="withIcon" />

        <View style={formCardStyle}>
          <ImagePickerSection
            selectedImage={selectedImage}
            imageRotation={imageRotation}
            imageFlip={imageFlip}
            originalSize={originalSize}
            compressedSize={compressedSize}
            isPreviewVisible={isPreviewVisible}
            onPickImage={handleImagePicker}
            onRotateImage={handleRotateImage}
            onFlipImage={handleFlipImage}
            onClearImage={clearImage}
            onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
            formatFileSize={formatFileSize}
          />
        </View>

        {enabledFields.labels && (
          <>
            <SectionHeader title="Labels" icon="label" variant="withIcon" />

            <View style={formCardStyle}>
              <LabelSelector
                labels={labels}
                selectedLabels={selectedLabels}
                onToggleLabel={handleLabelToggle}
                enabled={enabledFields.labels}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={submitButtonStyle}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              <View style={submitIconStyle}>
                <MaterialIcons
                  name="add"
                  size={20}
                  color={theme.colors.text.inverse}
                />
              </View>
              <Text style={submitButtonTextStyle}>Add Item</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  formCard: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 32,
    gap: 10,
  },
  submitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  bottomSpacer: {
    height: 24,
  },
  lookupIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  lookupText: {
    fontSize: 13,
  },
});

export default AddItemScreen;
