import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
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

const AddItemScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();

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

  const loadingIconStyle = useMemo(
    () => [
      styles.loadingIconContainer,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme.colors.background.secondary, theme.colors.borderSubtle],
  );

  const loadingTextStyle = useMemo(
    () => [
      styles.loadingText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.regular,
      theme.typography.sizes.md,
    ],
  );

  const {locations, labels, enabledFields, isConnecting, loadEnabledFields} =
    useItemData();

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
    React.useCallback(() => {
      loadEnabledFields();
      loadImageQuality();
    }, [loadEnabledFields, loadImageQuality]),
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

  if (isConnecting) {
    return (
      <View style={screenStyle}>
        <View style={styles.loadingContainer}>
          <View style={loadingIconStyle}>
            <ActivityIndicator
              size="large"
              color={theme.colors.accent.primary}
            />
          </View>
          <Text style={loadingTextStyle}>Connecting to server...</Text>
        </View>
      </View>
    );
  }

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
          />
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
});

export default AddItemScreen;
