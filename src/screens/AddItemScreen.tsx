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

interface SectionHeaderProps {
  title: string;
  icon?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({title, icon}) => {
  const {theme} = useTheme();

  const iconContainerStyle = useMemo(
    () => [
      styles.sectionIconContainer,
      {backgroundColor: theme.colors.accent.muted},
    ],
    [theme.colors.accent.muted],
  );

  const headerTextStyle = useMemo(
    () => [
      styles.sectionHeaderText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.semibold,
        letterSpacing: theme.typography.letterSpacing.wide,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.letterSpacing.wide,
      theme.typography.sizes.sm,
      theme.typography.weights.semibold,
    ],
  );

  const headerLineStyle = useMemo(
    () => [
      styles.sectionHeaderLine,
      {backgroundColor: theme.colors.accent.primary},
    ],
    [theme.colors.accent.primary],
  );

  return (
    <View style={styles.sectionHeader}>
      {icon && (
        <View style={iconContainerStyle}>
          <MaterialIcons
            name={icon}
            size={16}
            color={theme.colors.accent.primary}
          />
        </View>
      )}
      <Text style={headerTextStyle}>{title.toUpperCase()}</Text>
      <View style={headerLineStyle} />
    </View>
  );
};

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
      backgroundColor: theme.colors.card.background,
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
      {backgroundColor: theme.colors.accent.muted},
    ],
    [theme.colors.accent.muted],
  );

  const loadingTextStyle = useMemo(
    () => [
      styles.loadingText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.md,
      },
    ],
    [theme.colors.text.secondary, theme.typography.sizes.md],
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
      theme.shadows.md,
    ],
    [
      isLoading,
      theme.borderRadius.lg,
      theme.colors.accent.primary,
      theme.shadows.md,
    ],
  );

  const submitIconStyle = useMemo(
    () => [
      styles.submitIconContainer,
      {backgroundColor: 'rgba(255,255,255,0.2)'},
    ],
    [],
  );

  const submitButtonTextStyle = useMemo(
    () => [
      styles.submitButtonText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
      },
    ],
    [
      theme.colors.text.inverse,
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
        <SectionHeader title="Item Details" icon="info" />

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

        <SectionHeader title="Location" icon="place" />

        <View style={formCardStyle}>
          <LocationSelector
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />
        </View>

        <SectionHeader title="Image" icon="photo-camera" />

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
            <SectionHeader title="Labels" icon="label" />

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionHeaderText: {
    marginRight: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  formCard: {
    padding: 16,
    borderWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 24,
  },
});

export default AddItemScreen;
