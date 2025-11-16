import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useItemData } from '../hooks/useItemData';
import { useImageHandler } from '../hooks/useImageHandler';
import { useAddItemForm } from '../hooks/useAddItemForm';
import {
  ImagePickerSection,
  LocationSelector,
  LabelSelector,
  ItemFormFields,
} from '../components/AddItem';

const AddItemScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Custom Hooks
  const {
    locations,
    labels,
    enabledFields,
    isConnecting,
    loadEnabledFields,
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

  // Load settings on focus
  useFocusEffect(
    React.useCallback(() => {
      loadEnabledFields();
      loadImageQuality();
    }, [loadEnabledFields, loadImageQuality])
  );

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      title: 'Add Item',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
    });
  }, [navigation, theme]);

  // Handle submit
  const handleSubmit = async () => {
    const success = await submitItem(selectedImage, enabledFields, () => {
      resetForm();
      clearImage();
    });

    if (success) {
      navigation.goBack();
    }
  };

  // Handle quantity focus/blur
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

  // Loading state
  if (isConnecting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Connecting to server...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Item Form Fields */}
        <ItemFormFields
          formData={formData}
          enabledFields={enabledFields}
          isQuantityFocused={isQuantityFocused}
          onUpdateField={updateFormField}
          onQuantityFocus={handleQuantityFocus}
          onQuantityBlur={handleQuantityBlur}
        />

        {/* Location Selector */}
        <LocationSelector
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />

        {/* Image Picker */}
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

        {/* Label Selector */}
        <LabelSelector
          labels={labels}
          selectedLabels={selectedLabels}
          onToggleLabel={handleLabelToggle}
          enabled={enabledFields.labels}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.colors.button.primary,
              opacity: isLoading ? 0.5 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.button.text} />
          ) : (
            <>
              <MaterialIcons name="add" size={20} color={theme.colors.button.text} />
              <Text style={[styles.submitButtonText, { color: theme.colors.button.text }]}>
                Add Item
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddItemScreen;
